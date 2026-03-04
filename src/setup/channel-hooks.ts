// src/setup/channel-hooks.ts — Channel-specific post-hooks and session handlers.
// Extracted from step-channel-secrets.ts to stay under 200-line limit.
// WhatsApp-specific logic lives in setup-whatsapp.ts.

import { select, input } from "@inquirer/prompts";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { getSecret, setSecret } from "@/secrets/vault.ts";
import { c, printSuccess } from "@/setup/shared.ts";
import type { ChannelInfo } from "@/setup/channel-info.ts";
import { setupWhatsApp } from "@/setup/setup-whatsapp.ts";

// ── Session-based channels ───────────────────────────────────────────────────

export async function handleSessionChannel(ch: ChannelInfo): Promise<void> {
    // WhatsApp has its own full setup flow (QR pairing + account details)
    if (ch.name === "whatsapp") {
        await setupWhatsApp();
        return;
    }

    // Generic session-based channel (future-proof for others)
    const ready = ch.customCheck!();
    if (ready) {
        console.log(`  ${c.green}✓${c.reset} ${ch.displayName} session found — authenticated.`);
    } else {
        console.log(`  ${c.dim}○ No session found. Start the channel to authenticate:${c.reset}`);
        console.log(`  ${c.dim}  bun run ${ch.name}${c.reset}`);
    }
    console.log("");

    const choices: { value: string; name: string }[] = [
        { value: "back", name: `${c.green}${c.bold}← Back${c.reset}       ${c.dim}— return to channels${c.reset}` },
    ];
    if (ready) {
        choices.push({ value: "reset", name: `${c.bold}Reset session${c.reset} ${c.dim}— delete session & re-authenticate${c.reset}` });
    }

    const action = await select<string>({ message: "What would you like to do?", pageSize: 20, choices });
    if (action === "back") { console.log(""); return; }

    console.log("");
    if (action === "reset") {
        const sessionDir = resolve(".agents", `${ch.name}-sessions`);
        if (existsSync(sessionDir)) {
            rmSync(sessionDir, { recursive: true, force: true });
            printSuccess(`${ch.displayName} session deleted. Re-run the channel to authenticate.`);
        } else {
            console.log(`  ${c.dim}No session directory found.${c.reset}`);
        }
    }
    console.log("");
}

// ── Post-hooks for secret-based channels ─────────────────────────────────────

export async function runPostHook(ch: ChannelInfo): Promise<void> {
    if (ch.name === "telegram") await askTelegramOwnerId();
}

async function askTelegramOwnerId(): Promise<void> {
    const existingRaw = getSecret("TELEGRAM_OWNER_IDS");
    let ownerIds: number[] = [];
    if (existingRaw) {
        try { ownerIds = JSON.parse(existingRaw); } catch { /* ignore */ }
    }

    if (ownerIds.length > 0) {
        console.log(`\n  ${c.dim}Owner IDs (vault): ${ownerIds.join(", ")}${c.reset}`);
        const replace = await select<string>({
            message: "Replace existing owner IDs?",
            pageSize: 20,
            choices: [
                { value: "no", name: `${c.red}No${c.reset}  ${c.dim}— keep current IDs${c.reset}` },
                { value: "yes", name: `${c.green}Yes${c.reset} ${c.dim}— enter new IDs${c.reset}` },
            ],
        });
        if (replace !== "yes") {
            printSuccess(`Keeping owner IDs: ${ownerIds.join(", ")}`);
            return;
        }
        ownerIds = [];
    }

    console.log(`\n  ${c.dim}Owner IDs get full access including shell commands.${c.reset}`);
    console.log(`  ${c.dim}Find your ID at: https://t.me/userinfobot${c.reset}\n`);

    const ownerId = await input({ message: "Your Telegram user ID (Enter to skip)", default: "" });
    if (ownerId && !isNaN(Number(ownerId))) {
        ownerIds.push(Number(ownerId));
        setSecret("TELEGRAM_OWNER_IDS", JSON.stringify(ownerIds));
        printSuccess(`Owner ID saved to ${c.bold}encrypted vault${c.reset}: ${ownerId}`);
    }
}
