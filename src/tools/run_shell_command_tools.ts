// src/tools/run_shell_command_tools.ts — Run one or multiple shell commands with self-kill protection
import { tool } from "ai";
import { z } from "zod";
import { execSync } from "child_process";


const SUICIDE_PATTERNS = [
    /pkill.*bun/i,
    /pkill.*forkscout/i,
    /pkill.*index\.ts/i,
    /kill\s+(-9\s+)?(\$\$|%|`pgrep)/i,
    /killall.*bun/i,
    /bun\s+run\s+(start|dev|restart|safe-restart)/i,
    /bun\s+start/i,
    /bun\s+run\s+src\/index/i,
    /kill\s+-9?\s*\d{3,}/,
];

function isSuicideCommand(cmd: string): boolean {
    return SUICIDE_PATTERNS.some((p) => p.test(cmd));
}

interface CmdResult {
    command: string;
    success: boolean;
    output: string;
    error?: string;
    duration_ms: number;
}

function runOne(command: string, cwd?: string, timeout = 30000): CmdResult {
    if (isSuicideCommand(command)) {
        return { command, success: false, output: "", error: "BLOCKED: Use validate_and_restart to safely restart the agent.", duration_ms: 0 };
    }
    const start = Date.now();
    try {
        const output = execSync(command, { cwd: cwd ?? process.cwd(), timeout, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
        return { command, success: true, output: output.trim(), duration_ms: Date.now() - start };
    } catch (err: any) {
        return {
            command, success: false,
            output: (err.stdout as string | undefined)?.trim() ?? "",
            error: (err.stderr as string | undefined)?.trim() ?? (err as Error).message,
            duration_ms: Date.now() - start,
        };
    }
}

const CommandSchema = z.object({
    command: z.string().describe("Shell command to run"),
    cwd: z.string().optional().describe("Working directory (default: process.cwd())"),
    timeout: z.number().optional().describe("Timeout in ms (default: 30000)"),
    ignore_error: z.boolean().default(false).describe("Continue to next command even if this fails"),
});

export const run_shell_command_tools = tool({
    description:
        "Run one or more shell commands. Pass a single command string for quick use, " +
        "or an array of command objects to batch multiple commands in one call. " +
        "Array commands run sequentially — stops on first failure unless ignore_error is set. " +
        "CANNOT restart or kill the agent — use validate_and_restart for that.",
    inputSchema: z.object({
        commands: z.union([
            z.string().describe("Single shell command to run"),
            z.array(CommandSchema).min(1).max(15).describe("Multiple commands to run in sequence"),
        ]),
        cwd: z.string().optional().describe("Default working directory for all commands"),
        timeout: z.number().optional().describe("Default timeout in ms (default: 30000)"),
        stop_on_first_error: z.boolean().default(true).describe("Stop after first failure when batching (default: true)"),
    }),
    execute: async (input) => {
        const defaultCwd = input.cwd;
        const defaultTimeout = input.timeout ?? 30000;

        // Single string — fast path
        if (typeof input.commands === "string") {
            const r = runOne(input.commands, defaultCwd, defaultTimeout);
            return { success: r.success, output: r.output, error: r.error, duration_ms: r.duration_ms };
        }

        // Array — batch path
        const results: CmdResult[] = [];
        let stoppedEarly = false;
        for (const cmd of input.commands) {
            const r = runOne(cmd.command, cmd.cwd ?? defaultCwd, cmd.timeout ?? defaultTimeout);
            results.push(r);
            if (!r.success && !cmd.ignore_error && input.stop_on_first_error) {
                stoppedEarly = true;
                break;
            }
        }
        const failed = results.filter((r) => !r.success);
        return { success: failed.length === 0, results, failed_count: failed.length, stopped_early: stoppedEarly };
    },
});
