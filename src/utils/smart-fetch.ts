// src/utils/smart-fetch.ts — Smart fetch wrapper: auto-detects large responses, saves to temp file + summarizes

import { extractiveSummary } from "./extractive-summary.ts";
import { mkdir, writeFile } from "fs/promises";

const DEFAULT_MAX_CHARS = 5000; // If response exceeds this, treat as "large"

export interface SmartFetchOptions {
    /** Max chars before triggering save+summary. Default: 5000 */
    maxChars?: number;
    /** Max sentences in summary. Default: 6 */
    maxSentences?: number;
    /** Custom temp directory. Default: /tmp/forkscout */
    tempDir?: string;
    /** Label for the temp file. Default: "fetch" */
    label?: string;
}

export interface SmartFetchResult<T = any> {
    /** Whether content was large and saved to file */
    wasLarge: boolean;
    /** The actual data (truncated if wasLarge) */
    data: T;
    /** If wasLarge, path to temp file with full content */
    tempFilePath?: string;
    /** Summary if wasLarge, otherwise undefined */
    summary?: string;
    /** Original size in characters */
    originalSize: number;
}

/**
 * Wraps any fetch call. If response is large:
 * 1. Saves full content to temp file
 * 2. Returns a summary instead
 * 3. Caller can access full content via tempFilePath
 *
 * @example
 * const result = await smartFetch("https://api.example.com/large-data");
 * if (result.wasLarge) {
 *   console.log(`Saved to: ${result.tempFilePath}`);
 *   console.log(`Summary: ${result.summary}`);
 * }
 */
export async function smartFetch(
    url: string,
    options: SmartFetchOptions = {}
): Promise<SmartFetchResult<string>> {
    const {
        maxChars = DEFAULT_MAX_CHARS,
        maxSentences = 6,
        tempDir = "/tmp/forkscout",
        label = "fetch"
    } = options;

    // Ensure temp dir exists
    await mkdir(tempDir, { recursive: true });

    // Execute fetch
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "";
    let text: string;

    if (contentType.includes("application/json")) {
        const json = await response.json();
        text = JSON.stringify(json, null, 2);
    } else {
        text = await response.text();
    }

    const originalSize = text.length;

    // Check if content is "large"
    if (originalSize <= maxChars) {
        return {
            wasLarge: false,
            data: text,
            originalSize
        };
    }

    // Content is large — save to temp file
    const timestamp = Date.now();
    const safeLabel = label.replace(/[^a-z0-9]/gi, "_");
    const tempFilePath = `${tempDir}/${safeLabel}_${timestamp}.txt`;

    await writeFile(tempFilePath, text, "utf-8");

    // Generate summary
    const summary = extractiveSummary(text, { maxSentences, addNote: false });

    return {
        wasLarge: true,
        data: summary, // Return summary as the "data"
        tempFilePath,
        summary,
        originalSize
    };
}

/**
 * Shorthand: just get summary + temp file path for large content,
 * or raw text if small. Use when you don't need the wasLarge flag.
 */
export async function fetchWithSummary(
    url: string,
    options: SmartFetchOptions = {}
): Promise<{ content: string; tempFilePath?: string }> {
    const result = await smartFetch(url, options);

    if (result.wasLarge) {
        return {
            content: result.summary!,
            tempFilePath: result.tempFilePath
        };
    }

    return { content: result.data };
}
