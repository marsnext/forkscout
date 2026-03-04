// src/channels/telegram/api-core.ts — Core Telegram text/message API helpers

import { log } from "@/logs/logger.ts";
import { appendHistory } from "@/channels/chat-store.ts";

const logger = log("telegram/api");
export const BASE = "https://api.telegram.org/bot";

export async function sendMessage(
    token: string, chatId: number, text: string,
    parseMode: "MarkdownV2" | "HTML" | "Markdown" | "" = "",
    sync: boolean = false
): Promise<number | null> {
    const body: Record<string, unknown> = {
        chat_id: chatId, text, ...(parseMode ? { parse_mode: parseMode } : {}),
    };
    try {
        const res = await fetch(`${BASE}${token}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json() as { ok: boolean; result?: { message_id: number }; description?: string };
        if (!data.ok) { logger.error(`sendMessage rejected: ${data.description}`); return null; }
        const msgId = data.result?.message_id ?? null;
        if (sync && msgId !== null) appendHistory(`telegram-${chatId}`, [{ role: "assistant", content: text }]);
        return msgId;
    } catch (err) { logger.error("sendMessage failed:", err); return null; }
}

export async function editMessage(
    token: string, chatId: number, messageId: number, text: string,
    parseMode: "MarkdownV2" | "HTML" | "Markdown" | "" = ""
): Promise<boolean> {
    const body: Record<string, unknown> = {
        chat_id: chatId, message_id: messageId, text, ...(parseMode ? { parse_mode: parseMode } : {}),
    };
    try {
        const res = await fetch(`${BASE}${token}/editMessageText`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json() as { ok: boolean; description?: string };
        if (!data.ok) {
            if ((data.description ?? "").includes("message is not modified")) return true;
            if ((data.description ?? "").includes("message to edit not found")) return false; // expected: message deleted/expired
            logger.error("editMessage failed:", data.description);
            return false;
        }
        return true;
    } catch (err) { logger.error("editMessage error:", err); return false; }
}

export async function sendMessageWithInlineKeyboard(
    token: string, chatId: number, text: string, keyboard: any[][],
    parseMode: "MarkdownV2" | "HTML" | "Markdown" | "" = ""
): Promise<number | null> {
    const body: Record<string, unknown> = {
        chat_id: chatId, text,
        reply_markup: JSON.stringify({ inline_keyboard: keyboard }),
        ...(parseMode ? { parse_mode: parseMode } : {}),
    };
    try {
        const res = await fetch(`${BASE}${token}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json() as { ok: boolean; result?: { message_id: number }; description?: string };
        if (!data.ok) { logger.error(`sendMessageWithInlineKeyboard rejected: ${data.description}`); return null; }
        return data.result?.message_id ?? null;
    } catch (err) { logger.error("sendMessageWithInlineKeyboard failed:", err); return null; }
}

export async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string): Promise<boolean> {
    const body: Record<string, unknown> = { callback_query_id: callbackQueryId };
    if (text) body["text"] = text;
    try {
        const res = await fetch(`${BASE}${token}/answerCallbackQuery`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json() as { ok: boolean; description?: string };
        if (!data.ok) { logger.error(`answerCallbackQuery rejected: ${data.description}`); return false; }
        return true;
    } catch (err) { logger.error("answerCallbackQuery failed:", err); return false; }
}

export async function editMessageReplyMarkup(token: string, chatId: number, messageId: number, keyboard?: any[][]): Promise<boolean> {
    const body: Record<string, unknown> = { chat_id: chatId, message_id: messageId };
    if (keyboard) body["reply_markup"] = JSON.stringify({ inline_keyboard: keyboard });
    try {
        const res = await fetch(`${BASE}${token}/editMessageReplyMarkup`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json() as { ok: boolean; description?: string };
        if (!data.ok) { logger.error("editMessageReplyMarkup failed:", data.description ?? ""); return false; }
        return true;
    } catch (err) { logger.error("editMessageReplyMarkup error:", err); return false; }
}

export async function deleteMessage(token: string, chatId: number, messageId: number): Promise<boolean> {
    try {
        const res = await fetch(`${BASE}${token}/deleteMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
        });
        const data = await res.json() as { ok: boolean; description?: string };
        if (!data.ok) { logger.error(`deleteMessage rejected: ${data.description}`); return false; }
        return true;
    } catch (err) { logger.error("deleteMessage failed:", err); return false; }
}
