// src/tools/file_search_tools.ts — Glob-based file discovery
import { tool } from "ai";
import { z } from "zod";
import { execSync } from "child_process";


export const file_search_tools = tool({
    description:
        "Find files by glob pattern across the workspace. Returns matching paths sorted by modification time. " +
        "Supports patterns like 'src/tools/*.ts', '**/*.json', 'src/**/README.md'. " +
        "WHEN TO USE: finding files by name, extension, or path prefix; checking if a file exists; " +
        "discovering all files of a type (e.g. all .ts files under channels/). " +
        "WHEN NOT TO USE: searching for text inside files — use grep_search_tools. " +
        "Listing one directory — use list_dir_tools (simpler). " +
        "Always batch: pass multiple patterns in one call. " +
        "Example: patterns: ['src/channels/**/*.ts', '**/*.config.json'] finds all channel TS files + all config files.",
    inputSchema: z.object({
        patterns: z.array(
            z.string().describe("Glob pattern, e.g. 'src/tools/*.ts', 'src/**/README.md', '**/*.json'")
        ).min(1).max(10).describe("List of glob patterns to search"),
        cwd: z.string().optional().describe("Root directory to search from (default: process.cwd())"),
        exclude: z.string().optional().describe("Glob to exclude, e.g. 'node_modules/**' (default: node_modules + .git excluded)"),
        max_results: z.number().int().min(1).max(500).default(100).describe("Max total results (default: 100)"),
    }),
    execute: async (input) => {
        const { patterns, cwd = process.cwd(), exclude, max_results } = input;
        const excludeArgs = exclude
            ? `--exclude="${exclude}"`
            : "--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=.next";

        const allMatches: { pattern: string; path: string }[] = [];

        for (const pattern of patterns) {
            try {
                const raw = execSync(`find . -path "./${pattern}" ${excludeArgs} 2>/dev/null || true`, {
                    cwd,
                    encoding: "utf-8",
                    timeout: 10000,
                    stdio: ["pipe", "pipe", "pipe"],
                });
                const paths = raw.split("\n").map((l) => l.replace(/^\.\//, "").trim()).filter(Boolean);
                for (const p of paths) allMatches.push({ pattern, path: p });
            } catch {
                // Use glob via ls as fallback
                try {
                    const raw = execSync(`ls ${pattern} 2>/dev/null || true`, {
                        cwd,
                        encoding: "utf-8",
                        timeout: 5000,
                    });
                    const paths = raw.split("\n").map((l) => l.trim()).filter(Boolean);
                    for (const p of paths) allMatches.push({ pattern, path: p });
                } catch { /* no matches */ }
            }
        }

        const truncated = allMatches.length > max_results;
        const results = allMatches.slice(0, max_results);
        return {
            success: true,
            total_found: allMatches.length,
            truncated,
            results,
            paths: results.map((r) => r.path),
        };
    },
});
