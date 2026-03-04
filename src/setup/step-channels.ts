// src/setup/step-channels.ts — Configure communication channels.
// Shows all channels with setup status. Channels with all secrets configured
// show ✓, partially configured show ◐, unconfigured show ○.

import { select } from "@inquirer/prompts";
import { c } from "@/setup/shared.ts";
import { CHANNELS, isChannelConfigured, channelSecretProgress, type ChannelInfo } from "@/setup/channel-info.ts";
import { stepChannelSecrets } from "@/setup/step-channel-secrets.ts";

function statusBadge(ch: ChannelInfo): string {
    if (ch.builtIn) return `${c.dim}Built-in${c.reset}`;
    if (ch.customCheck) return ch.customCheck() ? `${c.green}✓ Ready${c.reset} ` : `${c.dim}○ Not set${c.reset}`;
    const { set, total } = channelSecretProgress(ch);
    if (total === 0) return `${c.dim}○ Not set${c.reset}`;
    if (set === total) return `${c.green}✓ Ready${c.reset} `;
    if (set > 0) return `${c.yellow}◐ ${set}/${total}${c.reset} `;
    return `${c.dim}○ Not set${c.reset}`;
}

export async function stepChannels(envVars: Map<string, string>): Promise<void> {
    while (true) {
        console.log(`${c.cyan}${c.bold}  Channels${c.reset}`);
        console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}`);
        console.log("");

        const choices = [
            { value: "__back__", name: `${c.green}${c.bold}← Back${c.reset}     ${c.dim}— return to main menu${c.reset}` },
            ...CHANNELS.map((ch) => ({
                value: ch.name,
                name: `${statusBadge(ch)}  ${c.bold}${ch.displayName}${c.reset}  ${c.dim}— ${ch.description}${c.reset}`,
            })),
        ];

        const choice = await select<string>({
            message: "Select a channel to configure",
            pageSize: 20,
            choices,
        });

        if (choice === "__back__") {
            console.log("");
            return;
        }

        console.log("");
        const channel = CHANNELS.find((ch) => ch.name === choice);
        if (channel) await stepChannelSecrets(channel, envVars);
    }
}
