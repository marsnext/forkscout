// src/setup/step-api-key.ts — Step 2: Configure API key (saved to encrypted vault).

import { select, password } from "@inquirer/prompts";
import { setSecret, getSecret } from "@/secrets/vault.ts";
import { c, printSuccess, type ProviderInfo } from "@/setup/shared.ts";

export async function stepApiKey(provider: ProviderInfo, _envVars: Map<string, string>): Promise<void> {
    console.log(`${c.cyan}${c.bold}  API Key${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}`);
    console.log("");

    // Custom providers already have their key — skip vault
    if (provider.custom) {
        printSuccess(`Custom provider — key configured inline`);
        console.log("");
        return;
    }

    if (!provider.envVar) {
        console.log(`  ${c.dim}No API key required for ${provider.displayName}${c.reset}`);
        console.log("");
        return;
    }

    const vaultExisting = getSecret(provider.envVar);

    if (vaultExisting) {
        const masked = vaultExisting.slice(0, 8) + "..." + vaultExisting.slice(-4);
        console.log(`  ${c.dim}Existing key found (vault): ${masked}${c.reset}`);

        const replace = await select<string>({
            message: "Replace existing key?",
            pageSize: 20,
            choices: [
                { value: "no", name: `${c.red}No${c.reset}  ${c.dim}— keep current key${c.reset}` },
                { value: "yes", name: `${c.green}Yes${c.reset} ${c.dim}— enter a new key${c.reset}` },
            ],
        });

        if (replace !== "yes") {
            printSuccess(`Keeping existing ${provider.envVar}`);
            console.log("");
            return;
        }
    }

    console.log(`  Enter your ${c.bold}${provider.displayName}${c.reset} API key:`);
    console.log(`  ${c.dim}Get one at: ${provider.keyUrl}${c.reset}`);
    console.log("");

    const key = await password({
        message: provider.envVar,
        mask: "*",
    });

    if (!key) {
        console.log(`  ${c.yellow}⚠ No key entered — you'll need to set ${provider.envVar} manually${c.reset}`);
    } else {
        setSecret(provider.envVar, key);
        printSuccess(`${provider.envVar} saved to ${c.bold}encrypted vault${c.reset}`);
    }
    console.log("");
}
