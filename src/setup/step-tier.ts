// src/setup/step-tier.ts — Tier-based model configuration (loop over all tiers).
// Shows all tiers with current models. User picks a tier, picks a model, config
// updates immediately. ← Back returns to tier list. ← Back from tier list exits.

import { select, input, search } from "@inquirer/prompts";
import { c, printSuccess, type ProviderInfo } from "@/setup/shared.ts";
import { buildDefaultConfig } from "@/setup/default-config.ts";
import { fetchModels, getHardcodedModels, type ModelEntry } from "@/setup/fetch-models.ts";
import { formatModelLine } from "@/setup/format-model.ts";
import { loadConfigFile, saveConfigFile } from "@/setup/env-helpers.ts";

const TIERS = [
    { key: "fast", desc: "cheapest, good for simple tasks" },
    { key: "balanced", desc: "speed/quality balance" },
    { key: "powerful", desc: "best reasoning" },
    { key: "vision", desc: "image/video understanding" },
    { key: "summarizer", desc: "condensing long outputs" },
] as const;

export interface TierResult {
    /** The default active tier (last one edited, or "balanced") */
    tier: string;
    /** Map of tier → chosen model */
    models: Record<string, string>;
}

/**
 * Tier + model selection loop.
 * Returns TierResult with all tier→model mappings, or null (← Back).
 */
export async function stepTier(provider: ProviderInfo): Promise<TierResult | null> {
    console.log(`${c.cyan}${c.bold}  Model Tiers${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}\n`);

    // Load existing config or build defaults
    const existing = loadConfigFile();
    const defaults = buildDefaultConfig({ provider: provider.name, tier: "balanced", agentName: "tmp" });
    const defaultTiers = defaults.llm.providers[provider.name] ?? {};

    // Current model map (from existing config or defaults)
    const models: Record<string, string> = {};
    const existingTiers = existing?.llm?.providers?.[provider.name] ?? {};
    for (const t of TIERS) models[t.key] = existingTiers[t.key] || defaultTiers[t.key] || "";

    // Fetch models once (reuse across tier picks)
    console.log(`  ${c.dim}Fetching models from ${provider.displayName}…${c.reset}`);
    const fetched = await fetchModels(provider);
    const allModels = fetched.length > 0
        ? fetched
        : getHardcodedModels(provider.name).map(id => ({ id, name: id } as ModelEntry));
    const src = fetched.length > 0 ? "API" : "defaults";
    const byType: Record<string, number> = {};
    for (const m of allModels) { const t = m.modality ?? "unknown"; byType[t] = (byType[t] ?? 0) + 1; }
    const hasMeta = Object.keys(byType).some(k => k !== "unknown");
    const summary = hasMeta
        ? Object.entries(byType).map(([k, v]) => `${v} ${k}`).join(", ")
        : `${allModels.length} models`;
    console.log(`  ${c.dim}${summary} (${src})${c.reset}\n`);

    let lastTier = "balanced";

    // ── Tier menu loop ────────────────────────────────────────────
    while (true) {
        const tier = await pickTier(models);
        if (!tier) return models.balanced ? { tier: lastTier, models } : null;

        const model = await pickModel(allModels, models[tier], tier);
        if (model) {
            models[tier] = model;
            lastTier = tier;
            persistTierModel(provider.name, tier, model, existing);
            printSuccess(`${tier}: ${model}`);
            console.log("");
        }
        // null from pickModel = ← Back → re-show tier list
    }
}

// ── Tier picker ──────────────────────────────────────────────────────────────

async function pickTier(models: Record<string, string>): Promise<string | null> {
    const choices = TIERS.map(t => {
        const model = models[t.key];
        const badge = model ? `${c.green}✓${c.reset} ${c.dim}${model}${c.reset}` : `${c.dim}not set${c.reset}`;
        return { value: t.key, name: `${t.key.padEnd(12)} ${badge}`, description: t.desc };
    });

    const tier = await select<string>({
        message: "Configure model for tier (pick to change)",
        pageSize: 20,
        choices: [
            { value: "__back__", name: `${c.green}← Done${c.reset}     ${c.dim}save & return${c.reset}` },
            ...choices,
        ],
    });
    return tier === "__back__" ? null : tier;
}

// ── Model picker (type-to-filter) ────────────────────────────────────────────

async function pickModel(
    models: ModelEntry[], current: string, tierName: string,
): Promise<string | null> {
    const sorted = [...models].sort((a, b) => a.id.localeCompare(b.id));
    const idx = sorted.findIndex(m => m.id === current);
    if (idx > 0) { const [it] = sorted.splice(idx, 1); sorted.unshift(it); }

    const result = await search<string>({
        message: `Choose model for ${tierName} (type to filter)`,
        pageSize: 20,
        source: (term) => {
            const q = (term ?? "").toLowerCase();
            const filtered = q ? sorted.filter(m => m.id.toLowerCase().includes(q)) : sorted;
            const choices: { value: string; name: string }[] = [
                { value: "__manual__", name: `${c.magenta}✏ Enter model ID manually${c.reset}` },
                { value: "__back__", name: `${c.green}← Back${c.reset} ${c.dim}— back to tiers${c.reset}` },
            ];
            choices.push(...filtered.map(m => ({
                value: m.id,
                name: m.id === current
                    ? `${c.green}${c.bold}${m.id}${c.reset} ${formatModelLine(m)} ${c.dim}← current${c.reset}`
                    : `${m.id} ${formatModelLine(m)}`,
            })));
            return choices;
        },
    });

    if (result === "__back__") { console.log(""); return null; }
    if (result === "__manual__") {
        const m = await input({ message: "Enter model ID:", validate: v => v.trim() ? true : "Required" });
        return m.trim();
    }
    return result;
}

// ── Persist single tier change to config ─────────────────────────────────────

function persistTierModel(provider: string, tier: string, model: string, cfg: any): void {
    const config = cfg ?? buildDefaultConfig({ provider, tier: "balanced", agentName: "ForkScout" });
    if (!config.llm) config.llm = {};
    if (!config.llm.providers) config.llm.providers = {};
    if (!config.llm.providers[provider]) config.llm.providers[provider] = {};
    config.llm.providers[provider][tier] = model;
    saveConfigFile(config);
}
