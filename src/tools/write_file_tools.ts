import { tool } from "ai";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";


export const write_file_tools = tool({
    description:
        "Write or overwrite one or more files. Creates parent directories automatically. " +
        "WHEN TO USE: creating a new file; doing a full rewrite where content completely changes. " +
        "WHEN NOT TO USE: surgical edits to existing files — use edit_file_tools instead (faster, no full rewrite, avoids overwrite bugs). " +
        "Always batch: pass all files in a single call rather than one file per call. " +
        "Example: files: [{path: 'src/utils/helper.ts', content: 'export const add = (a: number, b: number) => a + b;'}, " +
        "{path: 'src/utils/index.ts', content: 'export * from ./helper.ts;'}]",
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
