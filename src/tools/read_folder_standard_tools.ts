// src/tools/read_folder_standards.ts
// Reads README.md for one or more src/ subfolders.
// Call this before modifying ANY file in those folders.
import { tool } from "ai";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");


function readFolderStandard(folder: string) {
    const readmePath = resolve(srcDir, folder, "README.md");
    try {
        const content = readFileSync(readmePath, "utf-8");
        return { success: true as const, folder, content };
    } catch {
        try { readFileSync(resolve(srcDir, folder), "utf-8"); } catch (e: any) {
            if (e.code === "ENOENT") {
                return { success: false as const, folder, error: `Folder src/${folder}/ does not exist. Create it and write README.md before adding any code.` };
            }
        }
        return { success: false as const, folder, error: `No README.md found in src/${folder}/. Create it before editing this folder.` };
    }
}

export const read_folder_standard_tools = tool({
    description:
        "Read the coding standards, contracts, and file inventory for one or more src/ subfolders. " +
        "MANDATORY: call this BEFORE editing or creating any file inside a src/ subfolder you haven't worked in this session. " +
        "Returns each folder's README.md with: purpose, file format rules, naming conventions, and list of existing files. " +
        "WHEN TO USE: before any edit to src/tools/, src/channels/, src/providers/, src/agent/, etc. " +
        "WHEN NOT TO USE: for .agents/tools/ or config files outside src/. " +
        "Example: folders: ['tools', 'providers'] reads both READMEs before you add a new provider or tool.",
    inputSchema: z.object({
        folders: z.array(
            z.string().describe("Folder name under src/ \u2014 e.g. 'tools', 'channels', 'providers', 'agent', 'llm', 'utils', 'logs', 'mcp-servers'")
        ).min(1).max(10).describe("List of src/ subfolder names to read standards for"),
    }),
    execute: async (input) => {
        const results = input.folders.map(readFolderStandard);
        const failed = results.filter((r) => !r.success);
        return { success: failed.length === 0, results, failed_count: failed.length };
    },
});
