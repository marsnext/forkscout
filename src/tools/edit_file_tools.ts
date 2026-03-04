// src/tools/edit_file_tools.ts — In-place string replacement in files (no full rewrite needed)
import { tool } from "ai";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";


interface EditResult {
    path: string;
    success: boolean;
    replacements_made?: number;
    error?: string;
}

function applyEdit(path: string, oldString: string, newString: string, replaceAll: boolean): EditResult {
    let content: string;
    try {
        content = readFileSync(resolve(path), "utf-8");
    } catch (err) {
        return { path, success: false, error: `Cannot read file: ${(err as Error).message}` };
    }

    if (!content.includes(oldString)) {
        return { path, success: false, error: `oldString not found in file. Check whitespace, indentation, and exact characters.` };
    }

    let count = 0;
    let updated: string;
    if (replaceAll) {
        updated = content.split(oldString).join(newString);
        count = (content.split(oldString).length - 1);
    } else {
        updated = content.replace(oldString, newString);
        count = 1;
    }

    try {
        writeFileSync(resolve(path), updated, "utf-8");
        return { path, success: true, replacements_made: count };
    } catch (err) {
        return { path, success: false, error: `Cannot write file: ${(err as Error).message}` };
    }
}

export const edit_file_tools = tool({
    description:
        "Edit files by replacing exact string matches — no need to read and rewrite the whole file. " +
        "Pass an array of edits, each with a file path, the exact text to find (oldString), and the replacement (newString). " +
        "oldString MUST be unique in the file — include 3-5 lines of context around the change to avoid ambiguity. " +
        "Much faster than read_file + write_file for targeted edits.",
    inputSchema: z.object({
        edits: z.array(
            z.object({
                path: z.string().describe("Absolute or relative path to the file"),
                oldString: z.string().describe("Exact text to find and replace. Include surrounding context lines to make it unique."),
                newString: z.string().describe("Replacement text"),
                replaceAll: z.boolean().default(false).describe("Replace all occurrences (default: false — only first)"),
            })
        ).min(1).max(20).describe("List of edits to apply"),
    }),
    execute: async (input) => {
        const results: EditResult[] = input.edits.map((e) =>
            applyEdit(e.path, e.oldString, e.newString, e.replaceAll ?? false)
        );
        const failed = results.filter((r) => !r.success);
        return { success: failed.length === 0, results, failed_count: failed.length };
    },
});
