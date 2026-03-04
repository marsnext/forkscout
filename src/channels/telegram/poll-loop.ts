// src/channels/telegram/poll-loop.ts — Main poll loop, channel entry point

import type { AppConfig } from "@/config.ts";
import type { Channel } from "@/channels/types.ts";
import type { Message } from "@grammyjs/types";
import { sendMessage, deleteMessage, setMessageReaction } from "@/channels/telegram/api.ts";
import { handleMessage, handleCallbackQuery, handleDeniedUser } from "@/channels/telegram/message-handler.ts";
import { handleOwnerCommand } from "@/channels/telegram/owner-commands.ts";
import { handleSecretCommand } from "@/channels/telegram/secret-commands.ts";
import { seedAuthState, getRole, getVaultOwnerIds, checkRateLimit } from "@/channels/telegram/auth-helpers.ts";
import { loadRequests } from "@/channels/telegram/access-requests.ts";
import { getUpdates, sleep } from "@/channels/telegram/api-utils.ts";
import { runStartup } from "@/channels/telegram/startup.ts";
import { LLMError } from "@/llm/index.ts";
import { log } from "@/logs/logger.ts";

const logger = log("telegram/poll-loop");
const chatQueues = new Map<number, Promise<void>>();
const chatAbortControllers = new Map<number, AbortController>();

function hasContent(msg?: Message): boolean {
    if (!msg) return false;
    return !!(msg.text || msg.caption || msg.photo || msg.document || msg.audio ||
        msg.voice || msg.video || msg.animation || msg.location || msg.poll);
}

async function start(config: AppConfig): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set in .env");

    const vaultOwnerIds = getVaultOwnerIds();
    const savedRequests = loadRequests();
    seedAuthState(
        vaultOwnerIds,
        config.channels.telegram.allowedUserIds,
        savedRequests.filter((r) => r.status === "approved" && r.role === "admin").map((r) => r.userId),
        vaultOwnerIds.length === 0 && config.channels.telegram.allowedUserIds.length === 0
    );

    await runStartup(token, config, vaultOwnerIds);
    logger.info("Starting long-poll...");

    let offset = 0;
    while (true) {
        try {
            const updates = await getUpdates(token, offset, config.channels.telegram.pollingTimeout);
            for (const update of updates) {
                offset = update.update_id + 1;

                if (update.callback_query) {
                    await handleCallbackQuery(config, token, update.callback_query).catch((err) => logger.error("Callback error:", err));
                    continue;
                }

                if ((update as any).message_reaction) {
                    const reaction = (update as any).message_reaction;
                    const { chat, user, actor_chat, new_reaction = [], message_id } = reaction;
                    if (chat?.id && new_reaction.length > 0) {
                        const emoji = new_reaction.filter((r: any) => r.type === "emoji").map((r: any) => r.emoji).join("");
                        if (emoji) logger.info(`reaction from ${user?.id ?? actor_chat?.id}: ${emoji} on msg ${message_id}`);
                    }
                    continue;
                }

                const msg = update.message as Message | undefined;
                if (!hasContent(msg) || !msg) continue;

                const chatId = msg.chat.id;
                const userId = msg.from?.id ?? chatId;
                const username = msg.from?.username ?? null;
                const firstName = msg.from?.first_name ?? null;
                const text = msg.text ?? "";

                if (text === "/start") {
                    await sendMessage(token, chatId, `👋 Hi! I'm ${config.agent.name}. How can I help you?`);
                    continue;
                }

                const role = getRole(userId, config);
                if (role === "denied") {
                    await handleDeniedUser(config, token, chatId, userId, username, firstName).catch((err) => logger.error("Denied user error:", err));
                    continue;
                }

                if (text.startsWith("/") && role === "owner") {
                    await handleOwnerCommand(token, chatId, userId, text).catch(async (err) => {
                        logger.error("Owner command error:", err);
                        await sendMessage(token, chatId, `⚠️ Command error: ${String(err?.message ?? err).slice(0, 200)}`).catch(() => { });
                    });
                    continue;
                }

                if (text.startsWith("/secret")) {
                    await deleteMessage(token, chatId, msg.message_id).catch(() => { });
                    await handleSecretCommand(token, chatId, text).catch(async (err) => {
                        logger.error("Secret command error:", err);
                        await sendMessage(token, chatId, "⚠️ Secret command failed.").catch(() => { });
                    });
                    continue;
                }

                if (text.startsWith("/")) continue;

                const maxLen = config.channels.telegram.maxInputLength;
                if (maxLen > 0 && text.length > maxLen) {
                    await sendMessage(token, chatId, `⚠️ Message too long (max ${maxLen} characters).`);
                    continue;
                }

                if (role !== "owner" && role !== "admin" && !checkRateLimit(userId, config.channels.telegram.rateLimitPerMinute)) {
                    logger.warn(`Rate limit exceeded for userId ${userId}`);
                    await sendMessage(token, chatId, "⏳ Too many messages. Please wait a moment.");
                    continue;
                }

                logger.info(`[${role}] ${userId}/${chatId}: ${text.slice(0, 80)}`);

                const prevController = chatAbortControllers.get(chatId);
                if (prevController) { logger.info(`[abort] Aborting previous task for chatId=${chatId}`); prevController.abort(); }
                const controller = new AbortController();
                chatAbortControllers.set(chatId, controller);

                const prev = chatQueues.get(chatId) ?? Promise.resolve();
                const next = prev.then(() => {
                    if (controller.signal.aborted) { logger.info(`[abort] Skipping aborted task chatId=${chatId}`); return; }
                    return handleMessage(config, token, chatId, msg, role as "owner" | "admin" | "user", controller.signal)
                        .catch(async (err) => {
                            if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted"))) {
                                logger.info(`[abort] Task aborted chatId=${chatId}`); return;
                            }
                            logger.error("Handler error:", err);
                            const userMsg = (err instanceof LLMError) ? `⚠️ ${err.classified.userMessage}` : "⚠️ Something went wrong. Please try again.";
                            await sendMessage(token, chatId, userMsg).catch(() => { });
                        }).finally(() => { if (chatAbortControllers.get(chatId) === controller) chatAbortControllers.delete(chatId); });
                });
                chatQueues.set(chatId, next);
            }
        } catch (err) {
            if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) continue;
            logger.error("Poll error:", err);
            await sleep(3000);
        }
    }
}

export default { name: "telegram", start } satisfies Channel;
