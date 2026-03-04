// src/channels/telegram/secret-commands.ts — /secret command handler

import { sendMessage, deleteMessage } from "@/channels/telegram/api.ts";
import { setSecret, listAliases, deleteSecret } from "@/secrets/vault.ts";
import { log } from "@/logs/logger.ts";

const logger = log("telegram/secret-commands");

/** Handles /secret commands — runs at channel level, NEVER reaches the LLM. */
export async function handleSecretCommand(token: string, chatId: number, text: string): Promise<void> {
    const parts = text.trim().split(/\s+/);
    const sub = parts[1]?.toLowerCase();

    if (!sub || sub === "help") {
        await sendMessage(token, chatId,
            `🔐 <b>Secret Vault</b>\n\n` +
            `<code>/secret store &lt;alias&gt; &lt;value&gt;</code> — Save a secret\n` +
            `<code>/secret env &lt;ENV_VAR&gt; [alias]</code> — Import env var server-side\n` +
            `<code>/secret sync</code> — Import all .env vars into vault\n` +
            `<code>/secret list</code> — Show stored alias names\n` +
            `<code>/secret delete &lt;alias&gt;</code> — Remove an alias\n\n` +
            `⚠️ Your /secret messages are deleted immediately.`, "HTML");
        return;
    }

    if (sub === "store") {
        const alias = parts[2];
        const value = parts.slice(3).join(" ");
        if (!alias || !value) {
            await sendMessage(token, chatId, `⚠️ Usage: <code>/secret store &lt;alias&gt; &lt;value&gt;</code>`, "HTML");
            return;
        }
        const cleanAlias = alias.trim().toLowerCase().replace(/\s+/g, "_");
        setSecret(cleanAlias, value);
        logger.info(`[vault] stored: ${cleanAlias} (value redacted)`);
        await sendMessage(token, chatId,
            `✅ <b>Secret stored.</b>\n\nAlias: <code>${cleanAlias}</code>\nUse as: <code>{{secret:${cleanAlias}}}</code>\n\n<i>Value was never sent to the AI.</i>`, "HTML");
        return;
    }

    if (sub === "list") {
        const aliases = listAliases();
        if (!aliases.length) { await sendMessage(token, chatId, "🔐 Vault is empty."); return; }
        const lines = aliases.map(a => `• <code>{{secret:${a}}}</code>`).join("\n");
        await sendMessage(token, chatId, `🔐 <b>Stored secrets (${aliases.length})</b>\n\n${lines}\n\n<i>Values never shown.</i>`, "HTML");
        return;
    }

    if (sub === "delete") {
        const alias = parts[2];
        if (!alias) { await sendMessage(token, chatId, "⚠️ Usage: <code>/secret delete &lt;alias&gt;</code>", "HTML"); return; }
        const deleted = deleteSecret(alias.trim());
        await sendMessage(token, chatId, deleted ? `🗑️ Secret <code>${alias}</code> deleted.` : `⚠️ Alias <code>${alias}</code> not found.`, "HTML");
        return;
    }

    if (sub === "env") {
        const envVar = parts[2];
        if (!envVar) {
            await sendMessage(token, chatId,
                `⚠️ Usage: <code>/secret env &lt;ENV_VAR_NAME&gt; [alias]</code>\nExample: <code>/secret env OPENROUTER_API_KEY openrouter</code>`, "HTML");
            return;
        }
        const value = process.env[envVar];
        if (!value) {
            await sendMessage(token, chatId, `⚠️ Env var <code>${envVar}</code> is not set or empty.`, "HTML");
            return;
        }
        const alias = (parts[3] ?? envVar).trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "_");
        setSecret(alias, value);
        logger.info(`[vault] env var imported: ${envVar} → ${alias}`);
        await sendMessage(token, chatId,
            `✅ <b>Env var imported.</b>\n\n<code>${envVar}</code> → alias <code>${alias}</code>\nUse as: <code>{{secret:${alias}}}</code>\n\n<i>Value read server-side.</i>`, "HTML");
        return;
    }

    if (sub === "sync") {
        const { existsSync, readFileSync: rfs } = await import("node:fs");
        const { resolve: res } = await import("node:path");
        const envFile = res(process.cwd(), ".env");
        if (!existsSync(envFile)) { await sendMessage(token, chatId, "⚠️ No .env file found in project root.", "HTML"); return; }
        const lines = rfs(envFile, "utf-8").split("\n");
        const stored: string[] = [];
        const skipped: string[] = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
            if (!key || !val) { skipped.push(key || "(empty)"); continue; }
            const alias = key.toLowerCase().replace(/[^a-z0-9_\-]/g, "_");
            setSecret(alias, val);
            stored.push(`<code>${key}</code> → <code>{{secret:${alias}}}</code>`);
        }
        logger.info(`[vault] sync: stored ${stored.length} vars, skipped ${skipped.length}`);
        const msg = stored.length === 0
            ? "⚠️ No valid entries found in .env file."
            : `✅ <b>Synced ${stored.length} env var(s) to vault.</b>\n\n${stored.join("\n")}` +
            (skipped.length > 0 ? `\n\n<i>Skipped ${skipped.length} empty/invalid entries.</i>` : "") +
            `\n\n<i>Values read server-side.</i>`;
        await sendMessage(token, chatId, msg, "HTML");
        return;
    }

    await sendMessage(token, chatId, `⚠️ Unknown subcommand. Use <code>/secret help</code> for usage.`, "HTML");
}
