// src/providers/index.ts — Provider registry: getProvider(), getModel(), getModelForRole().
// Registry of known providers + getModel() + getModelForRole() helpers.
// To add a new provider: add a key to `registry` below.
//
// Model string format: "<provider>/<model-id>"
// Example: "openrouter/minimax/minimax-m2.5"

import type { LanguageModel } from "ai";
import type { LLMConfig, ProviderConfig } from "@/config.ts";
import {
    createOpenAICompatibleProvider,
    type OpenAICompatibleProvider,
} from "@/providers/open_ai_compatible_provider.ts";
import { createOpenRouterProvider } from "@/providers/openrouter_provider.ts";
import { createOpenAIProvider } from "@/providers/openai_provider.ts";
import { createAnthropicProvider } from "@/providers/anthropic_provider.ts";
import { createGoogleProvider } from "@/providers/google_provider.ts";
import { createXaiProvider } from "@/providers/xai_provider.ts";
import { createVercelProvider } from "@/providers/vercel_provider.ts";
import { createReplicateProvider } from "@/providers/replicate_provider.ts";
import { createHuggingFaceProvider } from "@/providers/huggingface_provider.ts";
import { createDeepSeekProvider } from "@/providers/deepseek_provider.ts";
import { createPerplexityProvider } from "@/providers/perplexity_provider.ts";

// ── Provider registry ────────────────────────────────────────────────────────
// Each key is the prefix used in the model string (before the first "/").
// Providers are lazily resolved so env vars are read at call time.

// Helper: create an OpenAI-compatible provider using only env var + base URL
const compat = (name: string, baseURL: string, envVar: string) => () =>
    createOpenAICompatibleProvider({ name, baseURL, apiKey: process.env[envVar] ?? "" });

const registry: Record<string, () => OpenAICompatibleProvider> = {
    openrouter: () => createOpenRouterProvider(),
    openai: () => createOpenAIProvider(),
    anthropic: () => createAnthropicProvider(),
    google: () => createGoogleProvider(),
    xai: () => createXaiProvider(),
    vercel: () => createVercelProvider(),
    replicate: () => createReplicateProvider(),
    huggingface: () => createHuggingFaceProvider(),
    deepseek: () => createDeepSeekProvider(),
    perplexity: () => createPerplexityProvider(),
    groq: compat("groq", "https://api.groq.com/openai/v1", "GROQ_API_KEY"),
    mistral: compat("mistral", "https://api.mistral.ai/v1", "MISTRAL_API_KEY"),
    together: compat("together", "https://api.together.xyz/v1", "TOGETHER_API_KEY"),
    fireworks: compat("fireworks", "https://api.fireworks.ai/inference/v1", "FIREWORKS_API_KEY"),
    deepinfra: compat("deepinfra", "https://api.deepinfra.com/v1/openai", "DEEPINFRA_API_KEY"),
    cerebras: compat("cerebras", "https://api.cerebras.ai/v1", "CEREBRAS_API_KEY"),
    cohere: compat("cohere", "https://api.cohere.com/v2", "COHERE_API_KEY"),
    baseten: compat("baseten", "https://bridge.baseten.co/v1/direct", "BASETEN_API_KEY"),
    aigateway: compat("aigateway", "https://ai-gateway.vercel.sh/v1", "AI_GATEWAY_API_KEY"),
    // Local providers — defaults to localhost, env vars override
    ollama: () => createOpenAICompatibleProvider({
        name: "ollama",
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
    }),
    lmstudio: () => createOpenAICompatibleProvider({
        name: "lmstudio",
        baseURL: process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234/v1",
        apiKey: "lm-studio",
    }),
    browserai: () => createOpenAICompatibleProvider({
        name: "browserai",
        baseURL: process.env.BROWSERAI_BASE_URL ?? "http://localhost:8080/v1",
        apiKey: "browser-ai",
    }),
};

// Cache instantiated providers
const _cache: Record<string, OpenAICompatibleProvider> = {};

export function getProvider(prefix: string): OpenAICompatibleProvider {
    if (!_cache[prefix]) {
        const factory = registry[prefix];
        if (!factory) {
            throw new Error(
                `Unknown provider "${prefix}" — known: ${Object.keys(registry).join(", ")}. ` +
                `For custom endpoints, add _type: "openai_compatible" and _baseURL to ` +
                `the provider entry in config, then call initProviders().`
            );
        }
        _cache[prefix] = factory();
    }
    return _cache[prefix];
}

/** Resolve _apiKey: literal string or $ENV_VAR reference */
function resolveApiKey(raw?: string): string {
    if (!raw) return "no-key";
    if (raw.startsWith("$")) return process.env[raw.slice(1)] ?? "no-key";
    return raw;
}

/**
 * Pre-register custom providers from config into the cache.
 * Call once at startup after loadConfig().
 * Scans providers map for entries with _type and creates instances.
 */
export function initProviders(llmConfig: LLMConfig): void {
    for (const [name, tiers] of Object.entries(llmConfig.providers)) {
        if (registry[name] || _cache[name]) continue; // known or already registered
        const pc = tiers as ProviderConfig;
        if (pc._type === "openai_compatible" && pc._baseURL) {
            _cache[name] = createOpenAICompatibleProvider({
                name,
                baseURL: pc._baseURL,
                apiKey: resolveApiKey(pc._apiKey),
            });
        }
    }
}

/**
 * Parses a model string and returns the LanguageModel.
 *
 * Format: "<provider>/<model-id>"
 * Example: "openrouter/minimax/minimax-m2.5"
 *          └─ provider: "openrouter", modelId: "minimax/minimax-m2.5"
 */
export function getModel(modelString: string): LanguageModel {
    const slashIndex = modelString.indexOf("/");
    if (slashIndex === -1) {
        throw new Error(
            `Invalid model string "${modelString}" — expected format: "<provider>/<model-id>"`
        );
    }

    const prefix = modelString.slice(0, slashIndex);
    const modelId = modelString.slice(slashIndex + 1);

    return getProvider(prefix).chat(modelId);
}

export type { OpenAICompatibleProvider };
export { createOpenAICompatibleProvider };

// ── Role-based model selection ────────────────────────────────────────────────

/**
 * Named purpose/role for model selection.
 * Each role maps to an optional field in ModelTiers.
 * If the role field is empty or undefined, a sensible tier is used as fallback.
 */
export type ModelRole = keyof import("@/config.ts").ModelTiers;

/** Fallback tier when a role's model string is absent or empty.
 *  NOTE: vision has NO fallback — sending images to a text-only model would fail silently.
 *  Providers that support vision must explicitly list a "vision" model. */
const ROLE_FALLBACK: Partial<Record<ModelRole, ModelRole>> = {
    summarizer: "fast",
};

/**
 * Return a LanguageModel for the given role using the active provider.
 *
 * Resolution order:
 * 1. `llm.providers[provider][role]` — if non-empty
 * 2. `llm.providers[provider][ROLE_FALLBACK[role]]` — if defined
 *
 * @throws if neither the role nor its fallback tier has a model configured
 */
export function getModelForRole(role: ModelRole, llmConfig: LLMConfig): LanguageModel {
    const { provider, providers } = llmConfig;
    const tiers = providers[provider];
    if (!tiers) {
        throw new Error(`Provider "${provider}" has no model tiers configured`);
    }

    const direct = tiers[role];
    if (direct) return getProvider(provider).chat(direct);

    const fallbackRole = ROLE_FALLBACK[role];
    const fallback = fallbackRole ? tiers[fallbackRole] : undefined;
    if (fallback) return getProvider(provider).chat(fallback);

    throw new Error(
        `No model configured for role "${role}" on provider "${provider}" and no fallback available`
    );
}