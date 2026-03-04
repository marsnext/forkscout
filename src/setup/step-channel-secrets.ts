// src/setup/step-channel-secrets.ts — Generic channel secret configuration.
// Works for any channel — reads requiredSecrets from ChannelInfo,
// shows current status, lets user set/replace each secret.
// Session-based and post-hook logic lives in channel-hooks.ts.

import { select, password, input } from "@inquirer/prompts";
import { getSecret, setSecret } from "@/secrets/vault.ts";
import { c, printSuccess, printSkipped } from "@/setup/shared.ts";
import type { ChannelInfo } from "@/setup/channel-info.ts";
import { handleSessionChannel, runPostHook } from "@/setup/channel-hooks.ts";

export async function stepChannelSecrets(ch: ChannelInfo, _envVars: Map<string, string>): Promise<void> {
    console.log(`${c.cyan}${c.bold}  ${ch.displayName}${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}`);
    console.log(`  ${c.dim}${ch.description}${c.reset}`);
    if (ch.setupUrl) console.log(`  ${c.dim}Setup guide: ${ch.setupUrl}${c.reset}`);
    console.log("");

    // Built-in channels — nothing to configure
    if (ch.builtIn) {
        console.log(`  ${c.green}✓${c.reset} ${ch.displayName} is built-in — no configuration needed.`);
        console.log("");
        return;
    }

    // Session-based channels (e.g. WhatsApp QR code)
    if (ch.customCheck && ch.requiredSecrets.length === 0) {
        await handleSessionChannel(ch);
        return;
    }

    // Show current status of all secrets
    const missingKeys: string[] = [];
    for (const key of ch.requiredSecrets) {
        const val = getSecret(key);
        if (val) {
            const masked = val.length > 12 ? val.slice(0, 8) + "..." + val.slice(-4) : "****";
            console.log(`  ${c.green}✓${c.reset} ${c.bold}${key}${c.reset} ${c.dim}(${masked})${c.reset}`);
        } else {
            console.log(`  ${c.dim}○ ${key} — not set${c.reset}`);
            missingKeys.push(key);
        }
    }
    console.log("");

    // Build action choices based on current state
    const allConfigured = missingKeys.length === 0;
    const choices: { value: string; name: string }[] = [
        { value: "back", name: `${c.green}${c.bold}← Back${c.reset}     ${c.dim}— return to channels${c.reset}` },
    ];

    if (!allConfigured) {
        choices.push({ value: "set_missing", name: `${c.bold}Set missing${c.reset} ${c.dim}— configure ${missingKeys.length} empty secret(s)${c.reset}` });
    }
    choices.push({ value: "set_all", name: `${c.bold}${allConfigured ? "Edit all" : "Set all"}${c.reset}     ${c.dim}— ${allConfigured ? "reconfigure" : "configure"} all secrets${c.reset}` });
    choices.push({ value: "pick", name: `${c.bold}Pick one${c.reset}   ${c.dim}— choose a specific secret to edit${c.reset}` });

    const action = await select<string>({ message: `What would you like to do?`, pageSize: 20, choices });
    if (action === "back") { console.log(""); return; }

    console.log("");

    if (action === "set_missing") {
        await setSecrets(ch, missingKeys);
    } else if (action === "set_all") {
        await setSecrets(ch, ch.requiredSecrets);
    } else if (action === "pick") {
        await pickAndSetSecret(ch);
    }

    // Channel-specific post-hooks (e.g. Telegram owner IDs)
    await runPostHook(ch);

    console.log("");
}

async function setSecrets(ch: ChannelInfo, keys: string[]): Promise<void> {
    if (keys.length === 0) {
        printSuccess(`All ${ch.displayName} secrets are already configured`);
        return;
    }

    for (const key of keys) {
        const isSensitive = /TOKEN|SECRET|PASSWORD|PASS|KEY/i.test(key);

        const value = isSensitive
            ? await password({ message: key, mask: "*" })
            : await input({ message: key });

        if (value) {
            setSecret(key, value);
            printSuccess(`${key} saved to ${c.bold}encrypted vault${c.reset}`);
        } else {
            printSkipped(`${key} — skipped`);
        }
    }
}

async function pickAndSetSecret(ch: ChannelInfo): Promise<void> {
    const choice = await select<string>({
        message: "Which secret to set?",
        pageSize: 20,
        choices: [
            { value: "__back__", name: `${c.green}${c.bold}← Back${c.reset}` },
            ...ch.requiredSecrets.map((key) => {
                const val = getSecret(key);
                const status = val ? `${c.green}✓${c.reset}` : `${c.dim}○${c.reset}`;
                return { value: key, name: `${status} ${c.bold}${key}${c.reset}` };
            }),
        ],
    });

    if (choice === "__back__") return;

    const isSensitive = /TOKEN|SECRET|PASSWORD|PASS|KEY/i.test(choice);
    const value = isSensitive
        ? await password({ message: choice, mask: "*" })
        : await input({ message: choice });

    if (value) {
        setSecret(choice, value);
        printSuccess(`${choice} saved to ${c.bold}encrypted vault${c.reset}`);
    } else {
        printSkipped(`${choice} — skipped`);
    }
}
