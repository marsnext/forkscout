// src/channels/telegram/tool-progress.ts — Tool progress helpers
// Import in message-handler.ts to provide labels and preview for tool calls.

/** Human-readable label for each tool name. Falls back to the tool name itself. */
export const TOOL_LABELS: Record<string, string> = {
    web_search: "Searching the web",
    web_broswer_tools: "Browsing",
    browse_web: "Browsing",
    navigate: "Navigating",
    read_file: "Reading file",
    write_file: "Writing file",
    list_dir: "Listing directory",
    run_shell_commands: "Running shell command",
    think_step_by_step: "Thinking",
    analyze_image: "Analyzing image",
    compress_text: "Compressing text",
};

/** Extracts the most meaningful short preview from a tool's input object. */
export function toolInputPreview(input: unknown): string {
    if (!input || typeof input !== "object") return "";
    const i = input as Record<string, unknown>;
    const best = i.query ?? i.url ?? i.command ?? i.path ?? i.filePath ?? i.text ?? i.prompt ?? i.file_id;
    if (typeof best === "string") return best.slice(0, 100);
    return "";
}
