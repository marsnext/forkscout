// src/tools/spawn_agent_tools.ts — Spawn up to 10 sub-agents in parallel, with optional fire-and-forget.
// Uses dynamic import of runAgent to avoid circular dependency (tools → agent → tools).
import { tool } from "ai";
import { z } from "zod";
import { getConfig } from "@/config.ts";
import type { AppConfig } from "@/config.ts";

const TaskSchema = z.object({
    task: z.string().describe(
        "Full task description for this sub-agent. Be explicit — provide all context. " +
        "The sub-agent starts with no history."
    ),
    sessionKey: z.string().optional().describe(
        "Memory session key. Defaults to 'sub-agent-<index>-<timestamp>'. " +
        "Set explicitly to share or isolate memory between sub-agents."
    ),
});

export const spawn_agent_tools = tool({
    description:
        "Spawn 1–10 sub-agents that each run a fully autonomous task in PARALLEL and return their results. " +
        "USE THIS WHEN: you need to delegate multiple independent sub-tasks simultaneously " +
        "(e.g. fetch 5 different URLs, analyse 3 files, post to 4 channels at once). " +
        "Each sub-agent has access to ALL bootstrap tools and MCP servers. " +
        "Sub-agents are fully isolated — no shared history with the parent or each other. " +
        "Provide full context in each task string. " +
        "Set fireAndForget=true to kick off tasks without waiting (e.g. background jobs, cron-style actions). " +
        "EXAMPLE: tasks=[{task:'summarise file A'},{task:'fetch news B'}], fireAndForget=false — runs both in parallel, returns both results.",
    inputSchema: z.object({
        tasks: z.array(TaskSchema).min(1).max(10).describe(
            "Array of 1–10 tasks to run in parallel. Each must be self-contained."
        ),
        role: z.enum(["owner", "admin", "user", "self"]).optional().default("self").describe(
            "Trust level applied to all sub-agents. Default: 'self' (no restrictions)."
        ),
        tier: z.enum(["fast", "balanced", "powerful"]).optional().describe(
            "Model tier for all sub-agents. Default: inherits current config tier. " +
            "Use 'fast' for cheap parallel tasks, 'powerful' for complex ones."
        ),
        excludeTools: z.array(z.string()).optional().describe(
            "Tool names to disable in all sub-agents. E.g. ['git_operations_tools'] for read-only tasks."
        ),
        fireAndForget: z.boolean().optional().default(false).describe(
            "If true, launch all sub-agents and return immediately without waiting for results. " +
            "Use for background jobs, notifications, or tasks where the result doesn't matter to the parent."
        ),
    }),
    execute: async (input) => {
        const config = getConfig();
        const batchTs = Date.now();

        // Apply optional tier override without mutating the shared config object.
        let effectiveConfig: AppConfig = config;
        if (input.tier && input.tier !== config.llm.tier) {
            effectiveConfig = {
                ...config,
                llm: { ...config.llm, tier: input.tier },
            };
        }

        // Dynamic import to break the circular: tools → agent → tools.
        const { runAgent } = await import("@/agent/run-agent.ts");

        const runOne = async (item: z.infer<typeof TaskSchema>, index: number) => {
            const sessionKey = item.sessionKey ?? `sub-agent-${index}-${batchTs}`;
            try {
                const result = await runAgent(effectiveConfig, {
                    userMessage: item.task,
                    role: input.role ?? "self",
                    excludeTools: input.excludeTools,
                    meta: { channel: "sub-agent", sessionKey },
                });
                return { index, success: true, result: result.text, steps: result.steps, sessionKey };
            } catch (err: any) {
                return { index, success: false, error: err?.message ?? String(err), sessionKey };
            }
        };

        const promises = input.tasks.map((item, i) => runOne(item, i));

        // Fire-and-forget: launch all, return immediately without awaiting.
        if (input.fireAndForget) {
            Promise.allSettled(promises).catch(() => { /* swallow — background tasks */ });
            return {
                success: true,
                fireAndForget: true,
                spawned: input.tasks.length,
                message: `${input.tasks.length} sub-agent(s) launched in background. Results will not be returned.`,
            };
        }

        // Parallel await: all run concurrently, collect all results.
        const settled = await Promise.allSettled(promises);
        const results = settled.map((s) =>
            s.status === "fulfilled" ? s.value : { success: false, error: String(s.reason) }
        );

        const failed = results.filter((r) => !r.success).length;
        return {
            success: failed === 0,
            total: input.tasks.length,
            succeeded: input.tasks.length - failed,
            failed,
            results,
        };
    },
});
