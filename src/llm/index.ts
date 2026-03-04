// src/llm/index.ts — LLM utilities: retry wrapper + LLM-powered summarisation
import { APICallError } from "@ai-sdk/provider";
import { generateText } from "ai";
import { classifyError, type ClassifiedError } from "@/llm/error-classifier.ts";
import { getConfig } from "@/config.ts";
import { getModelForRole } from "@/providers/index.ts";
import { extractiveSummary } from "@/utils/extractive-summary.ts";
import { log } from "@/logs/logger.ts";

// ── Retry wrapper ─────────────────────────────────────────────────────────────

const retryLogger = log("llm:retry");

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

/**
 * Error thrown when all retries are exhausted.
 * Channels can read `.classified` for clean user-facing messages.
 */
export class LLMError extends Error {
    readonly classified: ClassifiedError;
    constructor(classified: ClassifiedError) {
        super(classified.userMessage);
        this.name = "LLMError";
        this.classified = classified;
        this.cause = classified.original;
    }
}

/**
 * Runs `fn` with exponential backoff retry on transient LLM errors.
 * Retryable: 429, 5xx, 408, invalid-response.
 * NOT retried: 401/403, 400, 404 — permanent failures.
 */
export async function withRetry<T>(fn: () => Promise<T>, label = "llm"): Promise<T> {
    let lastClassified: ClassifiedError | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const classified = classifyError(err);
            lastClassified = classified;

            if (!classified.retryable) {
                retryLogger.error(`[${label}] fatal ${classified.category}: ${(err as any)?.message ?? err}`);
                throw new LLMError(classified);
            }

            if (attempt === MAX_RETRIES) break;

            const delayMs = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
            const status = APICallError.isInstance(err) ? ` (status ${(err as APICallError).statusCode})` : "";
            retryLogger.warn(`[${label}] attempt ${attempt + 1}/${MAX_RETRIES + 1} ${classified.category}${status} — retrying in ${delayMs}ms`);

            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    retryLogger.error(`[${label}] all ${MAX_RETRIES + 1} attempts failed (${lastClassified!.category})`);
    throw new LLMError(lastClassified!);
}

// ── LLM-powered summarisation ─────────────────────────────────────────────────

const summarizeLogger = log("llm-summarize");

export interface LLMSummarizeOptions {
    maxOutputTokens?: number;
    instruction?: string;
}

const DEFAULT_INSTRUCTION =
    "Summarise the following content into concise, meaningful key points. " +
    "Preserve all important facts, numbers, names, and conclusions. " +
    "Drop filler, repetition, and boilerplate. " +
    "Write in clear prose — not bullet points unless the input is structured data. " +
    "Be direct and dense: every sentence must carry information.";

/**
 * Synthesise `text` into a concise summary using the fast-tier LLM.
 * Falls back to extractive summarisation if the LLM call fails.
 */
export async function llmSummarize(
    text: string,
    opts: LLMSummarizeOptions = {}
): Promise<string> {
    if (!text || text.trim().length === 0) return "";

    const config = getConfig();
    const { maxOutputTokens = config.llm.llmSummarizeMaxTokens, instruction = DEFAULT_INSTRUCTION } = opts;

    try {
        const model = getModelForRole("summarizer", config.llm);
        const { text: summary } = await generateText({
            model,
            system: instruction,
            prompt: text,
            maxOutputTokens,
        });
        return summary.trim();
    } catch (err: any) {
        summarizeLogger.error(`LLM summarise failed (provider=${config.llm.provider}): ${err?.message} — falling back to extractive`);
        return extractiveSummary(text, { maxSentences: 8 });
    }
}
