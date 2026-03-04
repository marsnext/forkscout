import { tool } from "ai";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";


export const write_file_tools = tool({
    description: "Write content to one or more files (creates or overwrites, creates parent directories if needed). Pass an array of { path, content } objects.",
    inputSchema: z.object({
        files: z.array(
            z.object({
                path: z.string().describe("Absolute or relative path to the file"),
                content: z.string().describe("Content to write"),
            })
        ).min(1).max(20).describe("List of files to write"),
    }),
    execute: async (input) => {
        const results: { path: string; success: boolean; error?: string }[] = [];
        for (const file of input.files) {
            try {
                const abs = resolve(file.path);
                mkdirSync(dirname(abs), { recursive: true });
                writeFileSync(abs, file.content, "utf-8");
                results.push({ path: file.path, success: true });
            } catch (err) {
                results.push({ path: file.path, success: false, error: (err as Error).message });
            }
        }
        const failed = results.filter((r) => !r.success);
        return { success: failed.length === 0, results, failed_count: failed.length };
    },
});
