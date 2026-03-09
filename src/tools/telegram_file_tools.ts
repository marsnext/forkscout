// src/tools/telegram_file_tools.ts
// Download files from Telegram by file_id.
// Use this to get voice messages, photos, documents, audio, or any media
// that the user sent in a Telegram message.

import { tool } from "ai";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { getFile, downloadFile } from "@/channels/telegram/api.ts";
import { log } from "@/logs/logger.ts";

const logger = log("tool:telegram_file");
const DL_DIR = resolve(process.cwd(), ".agents", "downloads");

export const telegram_download_file = tool({
    description:
        "Download a Telegram file (photo, voice, document, audio, video) by its file_id and save it to .agents/downloads/. " +
        "Returns the local file path — pass it to other tools for further processing. " +
        "WHEN TO USE: user sends a photo → download then pass to analyze_image (for vision/OCR); " +
        "user sends a PDF → download then pass to pdf_tools (for text extraction); " +
        "user sends a voice message → download then transcribe. " +
        "File IDs come from the Telegram message object: voice→message.voice.file_id, photo→message.photo[-1].file_id, doc→message.document.file_id. " +
        "Limitation: max 20MB (Telegram API limit). " +
        "Example: {file_id: 'AgACAgIAAxkB...', filename: 'user_receipt.jpg'} → {local_path: '/path/.agents/downloads/user_receipt.jpg'}",
    inputSchema: z.object({
        file_id: z.string().describe(
            "The file_id from the Telegram message object. " +
            "For voice: message.voice.file_id. Photo: message.photo[-1].file_id. " +
            "Document: message.document.file_id."
        ),
        filename: z.string().optional().describe(
            "Optional filename to save as (e.g. 'voice.ogg', 'photo.jpg'). " +
            "If omitted, a name is generated from the file_id."
        ),
    }),
    execute: async (input) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) return { success: false, error: "TELEGRAM_BOT_TOKEN not set." };

        try {
            const fileInfo = await getFile(token, input.file_id);
            if (!fileInfo?.file_path) {
                return { success: false, error: `Could not get file info for file_id: ${input.file_id}` };
            }

            const data = await downloadFile(token, fileInfo.file_path);
            if (!data) {
                return { success: false, error: "Download failed — file may be expired or too large (>20MB)." };
            }

            mkdirSync(DL_DIR, { recursive: true });
            const ext = fileInfo.file_path.split(".").pop() ?? "bin";
            const name = input.filename ?? `${input.file_id.slice(-12)}.${ext}`;
            const localPath = resolve(DL_DIR, name);
            writeFileSync(localPath, data);

            logger.info(`Downloaded ${fileInfo.file_path} → ${localPath} (${data.byteLength} bytes)`);
            return {
                success: true,
                local_path: localPath,
                telegram_path: fileInfo.file_path,
                size_bytes: data.byteLength,
                extension: ext,
            };
        } catch (err: any) {
            return { success: false, error: err.message ?? String(err) };
        }
    },
});
