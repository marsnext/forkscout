// src/channels/telegram/api-media.ts — Telegram media/file sending helpers

import { log } from "@/logs/logger.ts";
import { BASE } from "@/channels/telegram/api-core.ts";

const logger = log("telegram/api-media");

async function sendApiRequest(token: string, method: string, body: Record<string, unknown>): Promise<number | null> {
    try {
        const res = await fetch(`${BASE}${token}/${method}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json() as { ok: boolean; result?: { message_id: number }; description?: string };
        if (!data.ok) { logger.error(`${method} rejected: ${data.description}`); return null; }
        return data.result?.message_id ?? null;
    } catch (err) { logger.error(`${method} failed:`, err); return null; }
}

const MEDIA_PARAM: Record<string, string> = {
    sendPhoto: "photo", sendDocument: "document", sendVoice: "voice",
    sendAudio: "audio", sendVideo: "video", sendAnimation: "animation",
};

async function sendMediaMessage(
    token: string, chatId: number, method: string, media: string,
    caption?: string, parseMode?: "HTML" | "Markdown"
): Promise<number | null> {
    const paramName = MEDIA_PARAM[method] ?? "document";
    const body: Record<string, unknown> = { chat_id: chatId, [paramName]: media };
    if (caption) body["caption"] = caption;
    if (parseMode) body["parse_mode"] = parseMode;
    return sendApiRequest(token, method, body);
}

export async function sendPhoto(token: string, chatId: number, photo: string, caption?: string, parseMode?: "HTML" | "Markdown"): Promise<number | null> {
    return sendMediaMessage(token, chatId, "sendPhoto", photo, caption, parseMode);
}

export async function sendDocument(token: string, chatId: number, document: string, caption?: string, parseMode?: "HTML" | "Markdown"): Promise<number | null> {
    return sendMediaMessage(token, chatId, "sendDocument", document, caption, parseMode);
}

export async function sendVoice(token: string, chatId: number, voice: string, caption?: string, parseMode?: "HTML" | "Markdown"): Promise<number | null> {
    return sendMediaMessage(token, chatId, "sendVoice", voice, caption, parseMode);
}

export async function sendAudio(
    token: string, chatId: number, audio: string,
    caption?: string, parseMode?: "HTML" | "Markdown", title?: string, performer?: string
): Promise<number | null> {
    const body: Record<string, unknown> = { chat_id: chatId, audio };
    if (caption) body["caption"] = caption;
    if (parseMode) body["parse_mode"] = parseMode;
    if (title) body["title"] = title;
    if (performer) body["performer"] = performer;
    return sendApiRequest(token, "sendAudio", body);
}

export async function sendVideo(token: string, chatId: number, video: string, caption?: string, parseMode?: "HTML" | "Markdown"): Promise<number | null> {
    return sendMediaMessage(token, chatId, "sendVideo", video, caption, parseMode);
}

export async function sendAnimation(token: string, chatId: number, animation: string, caption?: string, parseMode?: "HTML" | "Markdown"): Promise<number | null> {
    return sendMediaMessage(token, chatId, "sendAnimation", animation, caption, parseMode);
}

export async function sendLocation(token: string, chatId: number, latitude: number, longitude: number): Promise<number | null> {
    return sendApiRequest(token, "sendLocation", { chat_id: chatId, latitude, longitude });
}

export async function sendPoll(token: string, chatId: number, question: string, options: string[], isAnonymous?: boolean): Promise<number | null> {
    const body: Record<string, unknown> = { chat_id: chatId, question, options: JSON.stringify(options) };
    if (isAnonymous !== undefined) body["is_anonymous"] = isAnonymous;
    return sendApiRequest(token, "sendPoll", body);
}
