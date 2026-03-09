// src/tools/think_step_by_step_tools.ts
// Structured chain-of-thought scratchpad. Call this BEFORE complex tool sequences
// to reason out a plan. The output stays in context and guides subsequent steps.
// Does NOT call the LLM — it's just a structured way to surface reasoning.

import { tool } from "ai";
import { z } from "zod";

export const think_step_by_step = tool({
    description:
        "Record a structured reasoning plan before acting on a complex or risky task. " +
        "Write out the problem, ordered steps, risks, and what you are doing first. " +
        "Output stays in context to prevent loops and repetition. " +
        "WHEN TO USE: task has 4+ steps; before destructive operations (delete, overwrite, restart); " +
        "debugging a multi-layer issue; when two approaches exist and tradeoffs need comparison. " +
        "WHEN NOT TO USE: single-step trivial tasks — just do them without this overhead. " +
        "Example: {problem: 'Migrate SQLite schema without data loss', " +
        "steps: ['Backup .agents/db/', 'Write migration SQL', 'Run on dev copy', 'Apply to live db'], " +
        "risks: ['Table rename drops data if migration is wrong'], " +
        "decision: 'Start with backup to .agents/db-backup/'}",
    inputSchema: z.object({
        problem: z.string().describe("What problem or task you're solving"),
        steps: z.array(z.string()).describe("Your planned steps in order"),
        risks: z.array(z.string()).optional().describe("Potential issues or things that might go wrong"),
        decision: z.string().describe("What you've decided to do first"),
    }),
    execute: async (input) => {
        return {
            success: true,
            recorded: true,
            problem: input.problem,
            plan: input.steps,
            risks: input.risks ?? [],
            next_action: input.decision,
        };
    },
});
