// src/channels/telegram/api-utils.ts — Telegram API utilities
// Updated after extraction from original index.ts

import type { Update } from "@grammyjs/types";

/** Polls Telegram Bot API for updates. Returns empty array on timeout/error. */
export async function getUpdates(token: string, offset: number, timeout: number): Promise<Update[]> {
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=${timeout}&allowed_updates=["message","callback_query","message_reaction"]`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout((timeout + 10) * 1000) });
        const data = await res.json() as { ok: boolean; result: Update[] };
        if (!data.ok) return [];
        return data.result;
    } catch (err) {
        if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) return [];
        throw err;
    }
}

/** Sleep helper for retry delays. */
export function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
