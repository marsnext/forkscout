// src/agent/stream-agent.ts — streamText-based agent runner (live token output)
import { streamText, generateText, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import type { AppConfig } from "@/config.ts";
import { activity } from "@/logs/activity-log.ts";
import { log } from "@/logs/logger.ts";
import { withRetry } from "@/llm/index.ts";
import { sanitizeForDisplay } from "@/utils/secrets.ts";
import { buildAgentParams } from "@/agent/build-params.ts";
import { wrapToolsWithProgress } from "@/agent/tool-wrappers.ts";
import type { AgentRunOptions, AgentRunResult, StreamAgentResult } from "@/agent/types.ts";

const logger = log("agent");

function stripReasoning(text: string, tag?: string): string {
    if (!tag) return text;
    return text.replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>\\n?`, "gi"), "").trim();
}

export async function streamAgent(
    config: AppConfig,
    options: AgentRunOptions
): Promise<StreamAgentResult> {
    const { tools, bootstrapTools, model, systemPrompt, messages, devtoolsEnabled } =
        await buildAgentParams(config, options);

    const { channel, chatId } = options.meta ?? {};
    const startMs = Date.now();
    const reasoningTag = config.llm.reasoningTag?.trim();

    activity.msgIn(channel ?? "unknown", chatId, sanitizeForDisplay(options.userMessage));

    let streamStep = 0;
    const streamTools = options.onToolCall
        ? wrapToolsWithProgress(tools, options.onToolCall)
        : tools;

    const stream = streamText({
        model, system: systemPrompt, messages, tools: streamTools as any,
        stopWhen: stepCountIs(config.llm.maxSteps),
        maxTokens: config.llm.maxTokens,
        ...(options.abortSignal && { abortSignal: options.abortSignal }),
        ...(devtoolsEnabled && { experimental_telemetry: { isEnabled: true } }),
        onStepFinish(step: any) {
            streamStep++;
            if (typeof step.reasoningText === "string" && step.reasoningText.trim()) {
                logger.info(`[thinking step ${streamStep}]\n${step.reasoningText.trim()}`);
            }
            for (const tc of step.toolCalls ?? []) activity.toolCall(tc.toolName, tc.input, "agent", streamStep);
            for (const tr of step.toolResults ?? []) activity.toolResult(tr.toolName, tr.output, undefined, "agent", streamStep);
            if (options.onStepFinish) {
                Promise.resolve(options.onStepFinish((step.toolCalls?.length ?? 0) > 0)).catch(() => { });
            }
        },
    } as any);

    // Accumulate text here — stream.text throws "No output generated" after fullStream consumed (AI SDK v6 bug)
    const acc = { text: "" };

    async function* loggedTokenStream(): AsyncIterable<string> {
        let reasoningActive = false;

        const closeReasoning = async () => {
            if (!reasoningActive) return;
            reasoningActive = false;
            if (options.onThinkingEnd) { try { await options.onThinkingEnd(); } catch { /* never block stream */ } }
        };

        for await (const part of (stream as any).fullStream as AsyncIterable<import("ai").TextStreamPart<any>>) {
            if (part.type === "text-delta") {
                const delta = part.text ?? "";
                if (!delta) continue;
                if (reasoningActive) await closeReasoning();
                acc.text += delta;
                activity.token(delta, channel, chatId);
                process.stdout.write(delta);
                yield delta;
            } else if (part.type === "reasoning-delta" && part.text) {
                process.stdout.write(`\x1b[2m${part.text}\x1b[0m`);
                if (options.onThinkingDelta) { try { await options.onThinkingDelta(part.text); } catch { /* never block stream */ } }
            } else if (part.type === "reasoning-start") {
                if (reasoningActive) await closeReasoning();
                reasoningActive = true;
                process.stdout.write("\n\x1b[2m[thinking]\x1b[0m ");
                if (options.onThinkingStart) { try { await options.onThinkingStart(); } catch { /* never block stream */ } }
            } else if (part.type === "start-step") {
                process.stdout.write(`\n\x1b[90m── step ${streamStep + 1} ──\x1b[0m\n`);
            } else if (part.type === "error") {
                logger.warn(`[stream] non-fatal stream error: ${JSON.stringify(part.error ?? part)}`);
            }
        }

        if (reasoningActive) await closeReasoning();
        process.stdout.write("\n");
    }

    return {
        textStream: loggedTokenStream(),
        bootstrapToolNames: Object.keys(bootstrapTools),
        async finalize(): Promise<AgentRunResult> {
            const [response, steps] = await Promise.all([stream.response, stream.steps]);
            let strippedText = stripReasoning(acc.text, reasoningTag);
            let finalResponse = response;
            let finalSteps = steps;

            if (!strippedText.trim()) {
                logger.warn("[streamAgent] empty text after reasoning strip — retrying with nudge");
                const retryMessages: ModelMessage[] = [
                    ...messages, ...((response as any).messages as ModelMessage[]),
                    { role: "user", content: "[SYSTEM] You finished reasoning but produced no visible response. Respond to the user now — do NOT think silently again." } as ModelMessage,
                ];
                try {
                    const retryResult = await withRetry(() => generateText({
                        model, system: systemPrompt, messages: retryMessages, tools: streamTools as any,
                        stopWhen: stepCountIs(5), maxTokens: config.llm.maxTokens,
                    } as any), `streamAgent-retry:${channel ?? "unknown"}`);
                    const retryText = stripReasoning(retryResult.text, reasoningTag);
                    if (retryText.trim()) {
                        strippedText = retryText; finalResponse = retryResult.response; finalSteps = retryResult.steps;
                        logger.info("[streamAgent] retry succeeded");
                    } else logger.warn("[streamAgent] retry also produced empty text — giving up");
                } catch (err) { logger.error(`[streamAgent] retry failed: ${err}`); }
            }

            const text = strippedText.trim() || "(I finished thinking but produced no response. Please ask again or rephrase.)";
            activity.msgOut(channel ?? "unknown", chatId, text, (finalSteps as any)?.length ?? 0, Date.now() - startMs);
            return { text, steps: (finalSteps as any)?.length ?? 0, bootstrapToolNames: Object.keys(bootstrapTools), responseMessages: (finalResponse as any).messages as ModelMessage[] };
        },
    };
}
