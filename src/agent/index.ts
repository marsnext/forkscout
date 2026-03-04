// src/agent/index.ts — Agent entry point (re-exports only)
// Split into focused modules — edit those files, not this one.
//
//   types.ts          — AgentRunOptions, AgentRunResult, StreamAgentResult
//   tool-wrappers.ts  — wrapToolsWithErrorSafetyNet, wrapToolsWithSecretHandling, wrapToolsWithProgress
//   build-params.ts   — buildAgentParams (assembles model, tools, system prompt, role extension)
//   run-agent.ts      — runAgent (generateText path)
//   stream-agent.ts   — streamAgent (streamText path)

export type { AgentRunOptions, AgentRunResult, StreamAgentResult } from "@/agent/types.ts";
export { runAgent } from "@/agent/run-agent.ts";
export { streamAgent } from "@/agent/stream-agent.ts";
