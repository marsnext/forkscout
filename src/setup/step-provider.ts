// src/setup/step-provider.ts — Step 1: Choose LLM provider (or configure custom endpoint).

import { select, input } from "@inquirer/prompts";
import { c, PROVIDERS, printSuccess, type ProviderInfo } from "@/setup/shared.ts";

export async function stepProvider(): Promise<ProviderInfo | null> {
    console.log(`${c.cyan}${c.bold}  LLM Provider${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}`);
    console.log("");

    const choices = [
        ...PROVIDERS.map((p, i) => ({
            value: p.name,
            name: `${p.displayName.padEnd(14)} ${c.dim}${p.description}${c.reset}`,
            ...(i === 0 ? { description: "← recommended" } : {}),
        })),
        { value: "__custom__", name: `${c.magenta}Custom${c.reset}          ${c.dim}vLLM, or any OpenAI-compatible endpoint${c.reset}` },
        { value: "__back__", name: `${c.green}← Back${c.reset}          ${c.dim}return to main menu${c.reset}` },
    ];

    const providerName = await select<string>({
        message: "Choose your primary LLM provider",
        choices,
        default: "openrouter",
        pageSize: 20,
    });

    if (providerName === "__back__") { console.log(""); return null; }
    if (providerName === "__custom__") return await stepCustomProvider();

    const provider = PROVIDERS.find(p => p.name === providerName)!;
    console.log("");
    return provider;
}

async function stepCustomProvider(): Promise<ProviderInfo> {
    console.log("");
    console.log(`  ${c.dim}Configure an OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, etc.)${c.reset}`);
    console.log("");

    const name = await input({
        message: "Provider name (lowercase, e.g. ollama, lmstudio):",
        validate: (v) => {
            const n = v.trim().toLowerCase();
            if (!n) return "Name required";
            if (!/^[a-z][a-z0-9_]*$/.test(n)) return "lowercase letters, digits, underscores only";
            if (PROVIDERS.find(p => p.name === n)) return `"${n}" is a built-in provider — pick a different name`;
            return true;
        },
    });

    const baseURL = await input({
        message: "Base URL:",
        default: "http://localhost:11434/v1",
        validate: (v) => v.trim() ? true : "URL required",
    });

    const apiKey = await input({
        message: "API key (blank if none):",
        default: "no-key",
    });

    const trimmedName = name.trim().toLowerCase();
    console.log("");
    printSuccess(`Custom provider: ${c.bold}${trimmedName}${c.reset} → ${baseURL.trim()}`);
    console.log("");

    return {
        name: trimmedName,
        displayName: trimmedName,
        envVar: "",
        keyUrl: "",
        description: `Custom OpenAI-compatible (${baseURL.trim()})`,
        custom: { baseURL: baseURL.trim(), apiKey: apiKey.trim() || "no-key" },
    };
}
