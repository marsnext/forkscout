// src/setup/ui.ts — Banner, disclaimer, and summary display for the setup wizard.

import { select } from "@inquirer/prompts";
import { getSecret } from "@/secrets/vault.ts";
import { c, PROVIDERS } from "@/setup/shared.ts";

// ── Banner ───────────────────────────────────────────────────────────────────

export function printBanner(): void {
    console.log("");
    console.log(`${c.cyan}${c.bold}  ╔══════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.cyan}${c.bold}  ║                                                  ║${c.reset}`);
    console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.magenta}${c.bold}⑂  ForkScout — Setup Wizard${c.reset}                  ${c.cyan}${c.bold}║${c.reset}`);
    console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.dim}v3.0.0${c.reset}                                       ${c.cyan}${c.bold}║${c.reset}`);
    console.log(`${c.cyan}${c.bold}  ║                                                  ║${c.reset}`);
    console.log(`${c.cyan}${c.bold}  ╚══════════════════════════════════════════════════╝${c.reset}`);
    console.log("");
}

// ── Disclaimer ───────────────────────────────────────────────────────────────

export async function showDisclaimer(): Promise<boolean> {
    console.log(`${c.yellow}${c.bold}  ⚠  IMPORTANT — Please Read Before Continuing${c.reset}`);
    console.log(`${c.yellow}  ${"─".repeat(48)}${c.reset}`);
    console.log("");
    console.log(`  ForkScout is an ${c.bold}autonomous AI agent${c.reset} that can:`);
    console.log("");
    console.log(`    ${c.bold}•${c.reset} Execute shell commands on your system`);
    console.log(`    ${c.bold}•${c.reset} Read, write, and delete files`);
    console.log(`    ${c.bold}•${c.reset} Browse the web and make HTTP requests`);
    console.log(`    ${c.bold}•${c.reset} Install packages and modify configurations`);
    console.log(`    ${c.bold}•${c.reset} Run code and interact with external services`);
    console.log("");
    console.log(`  The agent operates ${c.bold}autonomously${c.reset} based on LLM decisions.`);
    console.log(`  While safety guards exist, ${c.yellow}no AI system is infallible${c.reset}.`);
    console.log("");
    console.log(`  ${c.dim}By continuing, you acknowledge that:${c.reset}`);
    console.log(`  ${c.dim}  1. You understand the risks of running an autonomous agent${c.reset}`);
    console.log(`  ${c.dim}  2. You will review the agent's actions and tool permissions${c.reset}`);
    console.log(`  ${c.dim}  3. You accept responsibility for the agent's operations${c.reset}`);
    console.log(`  ${c.dim}  4. You will not use this software for harmful purposes${c.reset}`);
    console.log("");
    console.log(`${c.yellow}  ${"─".repeat(48)}${c.reset}`);
    console.log("");

    const answer = await select<string>({
        message: "Do you accept and wish to continue?",
        pageSize: 20,
        choices: [
            { value: "no", name: `${c.red}No${c.reset}  ${c.dim}— cancel setup${c.reset}` },
            { value: "yes", name: `${c.green}Yes${c.reset} ${c.dim}— I accept and wish to continue${c.reset}` },
        ],
    });
    console.log("");
    return answer === "yes";
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function printSummary(generatedConfig: any): void {
    const provider = generatedConfig.llm.provider;
    const tier = generatedConfig.llm.tier;
    const tiers = generatedConfig.llm.providers[provider];
    const model = tiers?.[tier] ?? "—";
    const providerInfo = PROVIDERS.find(p => p.name === provider);
    const hasTelegram = !!getSecret("TELEGRAM_BOT_TOKEN");
    const agentName = generatedConfig.agent.name;
    const ownerIdsRaw = getSecret("TELEGRAM_OWNER_IDS");
    let ownerIds: number[] = [];
    if (ownerIdsRaw) { try { ownerIds = JSON.parse(ownerIdsRaw); } catch { /* ignore */ } }

    console.log(`${c.green}${c.bold}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`${c.green}${c.bold}    ✓ Setup Complete!${c.reset}`);
    console.log(`${c.green}${c.bold}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log("");
    console.log(`  ${c.dim}Provider:${c.reset}  ${c.bold}${providerInfo?.displayName ?? provider}${c.reset}`);
    console.log(`  ${c.dim}Tier:${c.reset}      ${c.bold}${tier}${c.reset}`);
    console.log(`  ${c.dim}Model:${c.reset}     ${c.bold}${model}${c.reset}`);
    console.log(`  ${c.dim}Telegram:${c.reset}  ${hasTelegram ? `${c.green}✓ configured${c.reset}` : `${c.dim}not configured${c.reset}`}`);
    if (ownerIds.length > 0) {
        console.log(`  ${c.dim}Owner:${c.reset}     ${c.bold}${ownerIds.join(", ")}${c.reset} ${c.dim}(vault)${c.reset}`);
    }
    console.log(`  ${c.dim}Agent:${c.reset}     ${c.bold}${agentName}${c.reset}`);
    console.log("");
    console.log(`  ${c.dim}Files generated:${c.reset}`);
    console.log(`    ${c.dim}•${c.reset} ${c.bold}src/forkscout.config.json${c.reset} ${c.dim}(full config — provider, tier, models, all defaults)${c.reset}`);
    console.log(`    ${c.dim}•${c.reset} .agents/vault.enc.json ${c.dim}(${c.green}encrypted secrets${c.reset}${c.dim})${c.reset}`);
    console.log(`    ${c.dim}•${c.reset} .env ${c.dim}(VAULT_KEY only — ${c.bold}no secrets in plain text${c.reset}${c.dim})${c.reset}`);
    console.log("");
    console.log(`  ${c.cyan}${c.bold}To start:${c.reset}`);
    if (hasTelegram) {
        console.log(`    ${c.bold}bun start${c.reset}       ${c.dim}— Start Telegram bot${c.reset}`);
    }
    console.log(`    ${c.bold}bun run cli${c.reset}     ${c.dim}— Terminal chat${c.reset}`);
    console.log(`    ${c.bold}bun run dev${c.reset}     ${c.dim}— Development mode (hot reload)${c.reset}`);
    console.log(`    ${c.bold}bun run setup${c.reset}   ${c.dim}— Run this wizard again${c.reset}`);
    console.log("");
}
