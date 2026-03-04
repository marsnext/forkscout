import { tool } from "ai";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";


/** Files at or below this line count are returned in full. */
const MAX_FULL_READ_LINES = 200;

function readOne(path: string, startLine?: number, endLine?: number) {
    try {
        const allLines = readFileSync(resolve(path), "utf-8").split("\n");
        const totalLines = allLines.length;
        if (startLine != null || endLine != null) {
            const start = Math.max(1, startLine ?? 1);
            const end = Math.min(totalLines, endLine ?? totalLines);
            return {
                success: true as const, path,
                content: allLines.slice(start - 1, end).join("\n"),
                startLine: start, endLine: end, totalLines, hasMore: end < totalLines,
            };
        }
        if (totalLines <= MAX_FULL_READ_LINES) {
            return { success: true as const, path, content: allLines.join("\n"), startLine: 1, endLine: totalLines, totalLines, hasMore: false };
        }
        return {
            success: true as const, path, content: null, totalLines,
            message: `File has ${totalLines} lines (>${MAX_FULL_READ_LINES}). Pass startLine/endLine to read a range.`,
        };
    } catch (err) {
        return { success: false as const, path, error: (err as Error).message };
    }
}

export const read_file_tools = tool({
    description:
        "Read one or more files. Pass an array of file requests. " +
        "Files \u2264200 lines: returns full content. " +
        "Files >200 lines: returns line count only \u2014 pass startLine/endLine for a range.",
    inputSchema: z.object({
        files: z.array(
            z.object({
                path: z.string().describe("Absolute or relative path to the file"),
                startLine: z.number().int().min(1).optional().describe("First line to read (1-based, inclusive)"),
                endLine: z.number().int().min(1).optional().describe("Last line to read (1-based, inclusive)"),
            })
        ).min(1).max(20).describe("List of files to read"),
    }),
    execute: async (input) => {
        const results = input.files.map((f) => readOne(f.path, f.startLine, f.endLine));
        const failed = results.filter((r) => !r.success);
        return { success: failed.length === 0, results, failed_count: failed.length };
    },
});
