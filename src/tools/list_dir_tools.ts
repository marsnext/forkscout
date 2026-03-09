import { tool } from "ai";
import { z } from "zod";
import { readdirSync, statSync } from "fs";
import { resolve } from "path";


export const list_dir_tools = tool({
    description:
        "List files and subdirectories in one or more directories. Returns entry names — directories end with '/'. " +
        "WHEN TO USE: exploring module structure, confirming a folder exists, seeing what files are present. " +
        "WHEN NOT TO USE: searching files by name pattern across the project — use file_search_tools (glob) instead; " +
        "reading file content — use read_file_tools; counting deeply nested files — use file_search_tools. " +
        "Always batch: pass multiple paths in one call instead of calling once per folder. " +
        "Example: paths: ['src/tools', 'src/channels', '.agents/tools'] lists all three at once.",
    inputSchema: z.object({
        paths: z.array(z.string().describe("Path to a directory"))
            .min(1).max(10).describe("List of directory paths to list"),
    }),
    execute: async (input) => {
        const results = input.paths.map((p) => {
            try {
                const entries = readdirSync(resolve(p)).map((name) => {
                    const full = resolve(p, name);
                    const isDir = statSync(full).isDirectory();
                    return isDir ? `${name}/` : name;
                });
                return { success: true as const, path: p, entries };
            } catch (err: any) {
                return { success: false as const, path: p, error: (err as Error).message };
            }
        });
        const failed = results.filter((r) => !r.success);
        return { success: failed.length === 0, results, failed_count: failed.length };
    },
});
