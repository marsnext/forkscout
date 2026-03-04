// src/setup/wizard.ts — Interactive terminal setup wizard for ForkScout
// Run: bun run setup  OR  bun run src/index.ts --setup
//
// Thin orchestrator — each step lives in its own file under src/setup/.
// Secrets go ONLY into the encrypted vault. .env contains only VAULT_KEY.

import { mkdirSync } from "fs";
import { manageVaultSecrets } from "@/setup/vault-manager.ts";
import { c, printSuccess } from "@/setup/shared.ts";
import { AGENTS_DIR, loadEnvFile, saveEnvFile, ensureVaultKey, isSecretVar, migrateEnvSecretsToVault, loadConfigFile, saveConfigFile } from "@/setup/env-helpers.ts";
import { buildDefaultConfig } from "@/setup/default-config.ts";
import { printBanner, showDisclaimer, printSummary } from "@/setup/ui.ts";
import { stepMainMenu } from "@/setup/step-main-menu.ts";
import { stepProvider } from "@/setup/step-provider.ts";
import { stepApiKey } from "@/setup/step-api-key.ts";
import { stepTier, type TierResult } from "@/setup/step-tier.ts";
import { stepChannels } from "@/setup/step-channels.ts";
import { stepAgentName } from "@/setup/step-agent-name.ts";
import { stepMedia } from "@/setup/step-media.ts";

// ── Provider config flow ─────────────────────────────────────────────────────

async function configureProviders(cleanEnv: Map<string, string>, existingConfig: any): Promise<void> {
    const provider = await stepProvider();
    if (!provider) return; // ← Back

    await stepApiKey(provider, cleanEnv);

    // Agent name first — needed to build config
    const agentName = await stepAgentName(existingConfig);

    // Generate base config so tiers have something to save into
    const generatedConfig = buildDefaultConfig({ provider: provider.name, tier: "balanced", agentName });

    // Inject custom provider overrides
    if (provider.custom) {
        generatedConfig.llm.providers[provider.name] = {
            _type: "openai_compatible",
            _baseURL: provider.custom.baseURL,
            _apiKey: provider.custom.apiKey,
            fast: "", balanced: "", powerful: "", summarizer: "",
        };
    }

    // Preserve existing custom fields
    if (existingConfig) {
        if (existingConfig.agent?.systemPromptExtra) generatedConfig.agent.systemPromptExtra = existingConfig.agent.systemPromptExtra;
        if (existingConfig.toolDefaults) generatedConfig.toolDefaults = existingConfig.toolDefaults;
        if (existingConfig.browser?.chromePath) generatedConfig.browser.chromePath = existingConfig.browser.chromePath;
        if (existingConfig.channels?.self?.jobs) generatedConfig.channels.self.jobs = existingConfig.channels.self.jobs;
    }

    // Save base config before tier selection (so tier edits update existing file)
    saveConfigFile(generatedConfig);

    // Tier loop — user picks tiers, models save to config immediately
    const result = await stepTier(provider);
    if (result) {
        // Update active tier in config
        const cfg = loadConfigFile() ?? generatedConfig;
        cfg.llm.tier = result.tier;
        saveConfigFile(cfg);
    }

    printSuccess("Configuration saved");
    console.log("");
}

// ── Main wizard ──────────────────────────────────────────────────────────────

export async function runSetupWizard(): Promise<void> {
    try {
        printBanner();

        const accepted = await showDisclaimer();
        if (!accepted) {
            console.log(`  ${c.dim}Setup cancelled. No changes were made.${c.reset}`);
            console.log("");
            return;
        }

        mkdirSync(AGENTS_DIR, { recursive: true });
        console.log(`  ${c.dim}Let's get your AI agent configured.${c.reset}`);
        console.log("");

        const existingConfig = loadConfigFile();
        const envVars = loadEnvFile();

        // Vault key
        const { vaultKey, generated: vaultKeyGenerated } = ensureVaultKey(envVars);
        printSuccess(vaultKeyGenerated ? `Generated VAULT_KEY (256-bit) for secret encryption` : `VAULT_KEY loaded`);

        // Migrate .env secrets → vault
        const migratedCount = migrateEnvSecretsToVault(envVars);
        if (migratedCount > 0) printSuccess(`Migrated ${migratedCount} secret(s) from .env → encrypted vault`);

        // Build clean env (VAULT_KEY + non-secret vars only)
        const cleanEnv = new Map<string, string>();
        cleanEnv.set("VAULT_KEY", vaultKey);
        for (const [key, value] of envVars) {
            if (key !== "VAULT_KEY" && !isSecretVar(key)) cleanEnv.set(key, value);
        }
        console.log("");

        // ── Main menu loop ───────────────────────────────────────────
        while (true) {
            const choice = await stepMainMenu();

            if (choice === "done") break;

            console.log("");
            if (choice === "vault") await manageVaultSecrets();
            else if (choice === "providers") await configureProviders(cleanEnv, existingConfig);
            else if (choice === "channels") await stepChannels(cleanEnv);
            else if (choice === "media") await stepMedia();
        }

        // Save .env and show summary
        saveEnvFile(cleanEnv);
        const finalConfig = loadConfigFile();
        if (finalConfig) {
            printSummary(finalConfig);
        } else {
            console.log(`\n  ${c.green}✓ Setup complete. Run ${c.bold}bun start${c.reset}${c.green} to launch.${c.reset}\n`);
        }
    } catch (err: any) {
        if (err.message?.includes("closed") || err.name === "ExitPromptError") {
            console.log(`\n  ${c.dim}Setup cancelled.${c.reset}\n`);
        } else {
            console.error(`\n  ${c.red}Error: ${err.message}${c.reset}\n`);
        }
    }
}

// ── Direct execution ─────────────────────────────────────────────────────────
if (import.meta.main) {
    runSetupWizard().then(() => process.exit(0));
}
