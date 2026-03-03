import type { IconType } from "react-icons";
import {
    SiBun, SiTypescript, SiDocker, SiNodedotjs,
    SiVercel, SiZod, SiSearxng,
} from "react-icons/si";
import { Plug, Database, Zap } from "lucide-react";

export interface TechItem {
    icon: IconType | React.ComponentType<{ className?: string }>;
    name: string;
    why: string;
    color: string;
    bg: string;
}

export const techStack: TechItem[] = [
    {
        icon: SiBun, name: "Bun", color: "text-amber-400", bg: "bg-amber-500/10",
        why: "Blazing-fast JS runtime with native TS, built-in bundler, and 3× faster installs.",
    },
    {
        icon: SiTypescript, name: "TypeScript", color: "text-blue-400", bg: "bg-blue-500/10",
        why: "Strict mode catches bugs at compile time. Every tool and provider is fully typed.",
    },
    {
        icon: SiVercel, name: "Vercel AI SDK v6", color: "text-purple-400", bg: "bg-purple-500/10",
        why: "Unified interface for 9+ LLM providers with streaming and multi-step agent loops.",
    },
    {
        icon: Plug, name: "MCP Protocol", color: "text-cyan-400", bg: "bg-cyan-500/10",
        why: "Add capabilities by dropping a JSON config file. Zero code changes required.",
    },
    {
        icon: SiSearxng, name: "SearXNG", color: "text-emerald-400", bg: "bg-emerald-500/10",
        why: "Self-hosted meta search. No API keys, no rate limits, fully private web search.",
    },
    {
        icon: Database, name: "LevelDB", color: "text-violet-400", bg: "bg-violet-500/10",
        why: "Embedded key-value store for persistent memory. Zero config, survives restarts.",
    },
    {
        icon: SiDocker, name: "Docker", color: "text-blue-300", bg: "bg-blue-500/10",
        why: "One command to deploy anywhere. Compose stack for agent, search, and memory.",
    },
    {
        icon: SiZod, name: "Zod", color: "text-teal-400", bg: "bg-teal-500/10",
        why: "Runtime schema validation for every tool input. Catches bad LLM params early.",
    },
    {
        icon: SiNodedotjs, name: "Node.js", color: "text-green-400", bg: "bg-green-500/10",
        why: "Battle-tested ecosystem with native child_process for real shell access.",
    },
    {
        icon: Zap, name: "Turbopack", color: "text-yellow-400", bg: "bg-yellow-500/10",
        why: "Next.js incremental bundler with near-instant HMR. Reloads in milliseconds.",
    },
];
