// src/setup/fetch-models.ts — Fetch available model IDs from provider APIs.
// Falls back to hardcoded tier defaults when the API is unreachable or unsupported.

import { getSecret } from "@/secrets/vault.ts";
import { c, type ProviderInfo } from "@/setup/shared.ts";
import { buildDefaultConfig } from "@/setup/default-config.ts";

/** Base URLs for providers that expose a models list endpoint. */
const PROVIDER_URLS: Record<string, { baseURL: string; type: "openai" | "anthropic" | "google" }> = {
    openrouter: { baseURL: "https://openrouter.ai/api/v1", type: "openai" },
    openai: { baseURL: "https://api.openai.com/v1", type: "openai" },
    anthropic: { baseURL: "https://api.anthropic.com/v1", type: "anthropic" },
    google: { baseURL: "https://generativelanguage.googleapis.com/v1beta", type: "google" },
    xai: { baseURL: "https://api.x.ai/v1", type: "openai" },
    deepseek: { baseURL: "https://api.deepseek.com", type: "openai" },
    groq: { baseURL: "https://api.groq.com/openai/v1", type: "openai" },
    mistral: { baseURL: "https://api.mistral.ai/v1", type: "openai" },
    together: { baseURL: "https://api.together.xyz/v1", type: "openai" },
    fireworks: { baseURL: "https://api.fireworks.ai/inference/v1", type: "openai" },
    deepinfra: { baseURL: "https://api.deepinfra.com/v1/openai", type: "openai" },
    cerebras: { baseURL: "https://api.cerebras.ai/v1", type: "openai" },
    cohere: { baseURL: "https://api.cohere.com/v2", type: "openai" },
    baseten: { baseURL: "https://bridge.baseten.co/v1/direct", type: "openai" },
    aigateway: { baseURL: "https://ai-gateway.vercel.sh/v1", type: "openai" },
    ollama: { baseURL: "http://localhost:11434/v1", type: "openai" },
    lmstudio: { baseURL: "http://localhost:1234/v1", type: "openai" },
    browserai: { baseURL: "http://localhost:8080/v1", type: "openai" },
};

export type ModelModality = "language" | "image" | "video" | "embedding" | "audio" | "unknown";

export interface ModelPricing {
    /** Cost per input token (string like "0.000001") */
    input?: string;
    /** Cost per output token */
    output?: string;
    /** Cost per image (for image models) */
    image?: string;
}

export interface ModelEntry {
    id: string;
    name?: string;
    modality?: ModelModality;
    pricing?: ModelPricing;
    contextWindow?: number;
}

/** Fetch models from the provider API. Returns empty array on failure. */
export async function fetchModels(provider: ProviderInfo): Promise<ModelEntry[]> {
    try {
        // Custom providers — use their baseURL
        if (provider.custom) {
            return await fetchOpenAIModels(provider.custom.baseURL, provider.custom.apiKey);
        }

        const spec = PROVIDER_URLS[provider.name];
        if (!spec) return []; // No API endpoint (perplexity, vercel, replicate, etc.)

        const apiKey = getSecret(provider.envVar) ?? "";

        if (spec.type === "openai") return await fetchOpenAIModels(spec.baseURL, apiKey);
        if (spec.type === "anthropic") return await fetchAnthropicModels(apiKey);
        if (spec.type === "google") return await fetchGoogleModels(apiKey);
        return [];
    } catch {
        return [];
    }
}

/** GET /models — OpenAI-compatible shape: { data: [{ id }] } */
async function fetchOpenAIModels(baseURL: string, apiKey: string): Promise<ModelEntry[]> {
    const url = `${baseURL.replace(/\/+$/, "")}/models`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json: any = await res.json();
    const data: any[] = json?.data ?? [];
    return data.map((m) => parseOpenAIModel(m)).sort((a, b) => a.id.localeCompare(b.id));
}

/** Parse a single model object from OpenAI-compatible APIs (handles OpenRouter, AI Gateway, standard). */
function parseOpenAIModel(m: any): ModelEntry {
    const entry: ModelEntry = { id: m.id, name: m.name ?? m.id };

    // Modality: AI Gateway uses "type", OpenRouter uses architecture.output_modalities
    if (m.type && m.type !== "model") {
        entry.modality = (["language", "image", "video", "embedding", "audio"].includes(m.type) ? m.type : "unknown") as ModelModality;
    } else if (m.architecture?.output_modalities) {
        const out: string[] = m.architecture.output_modalities;
        if (out.includes("image")) entry.modality = "image";
        else if (out.includes("video")) entry.modality = "video";
        else entry.modality = "language";
    }

    // Pricing: AI Gateway uses input/output/image, OpenRouter uses prompt/completion
    const p = m.pricing;
    if (p) {
        entry.pricing = {
            input: p.input ?? p.prompt ?? undefined,
            output: p.output ?? p.completion ?? undefined,
            image: p.image ?? undefined,
        };
    }

    // Context window
    entry.contextWindow = m.context_window ?? m.context_length ?? undefined;
    return entry;
}

/** Anthropic: x-api-key + anthropic-version header */
async function fetchAnthropicModels(apiKey: string): Promise<ModelEntry[]> {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json: any = await res.json();
    const data: any[] = json?.data ?? [];
    return data.map((m) => ({ id: m.id, name: m.display_name ?? m.id })).sort((a, b) => a.id.localeCompare(b.id));
}

/** Google: API key as query param, different response shape */
async function fetchGoogleModels(apiKey: string): Promise<ModelEntry[]> {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json: any = await res.json();
    const models: any[] = json?.models ?? [];
    return models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => ({ id: m.name?.replace("models/", "") ?? "", name: m.displayName ?? m.name }))
        .filter((m) => m.id)
        .sort((a, b) => a.id.localeCompare(b.id));
}

/** Get hardcoded tier models as fallback. */
export function getHardcodedModels(providerName: string): string[] {
    const tmp = buildDefaultConfig({ provider: providerName, tier: "balanced", agentName: "tmp" });
    const tiers: Record<string, string> | undefined = tmp.llm.providers[providerName];
    if (!tiers) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const key of ["fast", "balanced", "powerful", "vision", "summarizer"]) {
        const m = tiers[key];
        if (m && !m.startsWith("_") && !seen.has(m)) { seen.add(m); result.push(m); }
    }
    return result;
}
