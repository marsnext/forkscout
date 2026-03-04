// src/channels/telegram/migration-helpers.ts — One-time migration for old split files
// Imports in index.ts after extraction from original index.ts

import { log } from "@/logs/logger.ts";
import type { ModelMessage } from "ai";
import { readFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import type { Message } from "@grammyjs/types";

const logger = log("telegram/migration");

/**
 * One-time migration: split-by-role files (user.json, assistant.json, tool.json)
 * → unified history.json. Handles raw Telegram Message objects in user.json.
 */
export function migrateSplitFiles(chatId: number): void {
    const sessionKey = `telegram-${chatId}`;
    const CHATS_DIR = resolve(".agents", "chats");
    const dir = resolve(CHATS_DIR, `telegram-${chatId}`);
    const userFile = resolve(dir, "user.json");

    // Only migrate if old user.json exists and history.json doesn't
    if (!existsSync(userFile)) return;
    if (existsSync(resolve(dir, "history.json"))) {
        // history.json already exists — just clean up leftover split files
        for (const name of ["user.json", "assistant.json", "tool.json", "system.json"]) {
            try { const p = resolve(dir, name); if (existsSync(p)) unlinkSync(p); } catch { /* ignore */ }
        }
        return;
    }

    logger.info(`Migrating split chat files → history.json for chat ${chatId}`);

    type SeqEntry = { seq: number } & Record<string, any>;
    const all: SeqEntry[] = [];

    // user.json: raw Telegram Message objects — compile to ModelMessage
    try {
        const rawUsers = JSON.parse(readFileSync(userFile, "utf-8"));
        if (Array.isArray(rawUsers)) {
            for (const m of rawUsers) {
                if (m && typeof m === "object" && typeof m.date === "number") {
                    all.push({ seq: m.date, ...compileTelegramMessage(m) });
                }
            }
        }
    } catch { /* skip corrupted */ }

    // assistant.json + tool.json: already have seq + role/content
    for (const role of ["assistant", "tool", "system"]) {
        const path = resolve(dir, `${role}.json`);
        if (!existsSync(path)) continue;
        try {
            const parsed = JSON.parse(readFileSync(path, "utf-8"));
            if (Array.isArray(parsed)) {
                for (const entry of parsed) {
                    if (entry && typeof entry === "object" && typeof entry.seq === "number") {
                        all.push(entry);
                    }
                }
            }
        } catch { /* skip corrupted */ }
    }

    if (all.length > 0) {
        all.sort((a, b) => a.seq - b.seq);
        const messages: ModelMessage[] = all.map(({ seq: _, ...msg }) => msg as ModelMessage);
        saveHistory(sessionKey, messages);
        logger.info(`Migrated ${messages.length} messages for chat ${chatId}`);
    }

    // Clean up old split files
    for (const name of ["user.json", "assistant.json", "tool.json", "system.json"]) {
        try { const p = resolve(dir, name); if (existsSync(p)) unlinkSync(p); } catch { /* ignore */ }
    }
}

// ─────────────────────────────────────────────
// Helper imports (re-exported for internal use)
// ─────────────────────────────────────────────

import { compileTelegramMessage } from "@/channels/telegram/compile-message.ts";
import { saveHistory } from "@/channels/chat-store.ts";
