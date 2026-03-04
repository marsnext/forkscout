// src/setup/shared.ts — Shared types, constants, and helpers for setup wizard steps.

// ── ANSI color helpers ───────────────────────────────────────────────────────

export const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    red: "\x1b[31m",
    white: "\x1b[37m",
};

// ── Provider metadata ────────────────────────────────────────────────────────

export interface ProviderInfo {
    name: string;
    displayName: string;
    envVar: string;
    keyUrl: string;
    description: string;
    /** Custom OpenAI-compatible endpoint config (set during setup) */
    custom?: { baseURL: string; apiKey: string };
}

export const PROVIDERS: ProviderInfo[] = [
    { name: "openrouter", displayName: "OpenRouter", envVar: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/keys", description: "200+ models with one key — recommended" },
    { name: "openai", displayName: "OpenAI", envVar: "OPENAI_API_KEY", keyUrl: "https://platform.openai.com/api-keys", description: "GPT-4o, o3, DALL·E, Whisper, TTS" },
    { name: "anthropic", displayName: "Anthropic", envVar: "ANTHROPIC_API_KEY", keyUrl: "https://console.anthropic.com/settings/keys", description: "Claude models (Haiku, Sonnet, Opus)" },
    { name: "google", displayName: "Google", envVar: "GOOGLE_GENERATIVE_AI_API_KEY", keyUrl: "https://aistudio.google.com/apikey", description: "Gemini models (Flash, Pro)" },
    { name: "xai", displayName: "xAI", envVar: "XAI_API_KEY", keyUrl: "https://console.x.ai/", description: "Grok models" },
    { name: "deepseek", displayName: "DeepSeek", envVar: "DEEPSEEK_API_KEY", keyUrl: "https://platform.deepseek.com/api_keys", description: "DeepSeek Chat & Reasoner" },
    { name: "perplexity", displayName: "Perplexity", envVar: "PERPLEXITY_API_KEY", keyUrl: "https://www.perplexity.ai/settings/api", description: "Sonar models — built-in web search" },
    { name: "groq", displayName: "Groq", envVar: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", description: "Ultra-fast inference (Llama, Mixtral, Gemma)" },
    { name: "mistral", displayName: "Mistral", envVar: "MISTRAL_API_KEY", keyUrl: "https://console.mistral.ai/api-keys", description: "Mistral, Mixtral, Pixtral models" },
    { name: "together", displayName: "Together", envVar: "TOGETHER_API_KEY", keyUrl: "https://api.together.xyz/settings/api-keys", description: "Open-source models at scale" },
    { name: "fireworks", displayName: "Fireworks", envVar: "FIREWORKS_API_KEY", keyUrl: "https://fireworks.ai/account/api-keys", description: "Fast open-source model inference" },
    { name: "deepinfra", displayName: "DeepInfra", envVar: "DEEPINFRA_API_KEY", keyUrl: "https://deepinfra.com/dash/api_keys", description: "Cheap open-source model hosting" },
    { name: "cerebras", displayName: "Cerebras", envVar: "CEREBRAS_API_KEY", keyUrl: "https://cloud.cerebras.ai/platform", description: "Wafer-scale fast inference" },
    { name: "cohere", displayName: "Cohere", envVar: "COHERE_API_KEY", keyUrl: "https://dashboard.cohere.com/api-keys", description: "Command models + RAG" },
    { name: "vercel", displayName: "Vercel", envVar: "VERCEL_API_KEY", keyUrl: "https://vercel.com/account/tokens", description: "Vercel AI Gateway (multi-provider)" },
    { name: "replicate", displayName: "Replicate", envVar: "REPLICATE_API_TOKEN", keyUrl: "https://replicate.com/account/api-tokens", description: "Open-source models (Llama, etc.)" },
    { name: "huggingface", displayName: "HuggingFace", envVar: "HUGGINGFACE_API_KEY", keyUrl: "https://huggingface.co/settings/tokens", description: "Open-source models" },
    { name: "baseten", displayName: "Baseten", envVar: "BASETEN_API_KEY", keyUrl: "https://app.baseten.co/settings/api_keys", description: "Production model inference platform" },
    { name: "aigateway", displayName: "AI Gateway", envVar: "AI_GATEWAY_API_KEY", keyUrl: "https://vercel.com/ai-gateway", description: "Vercel AI Gateway — 200+ models, one API" },
    { name: "ollama", displayName: "Ollama", envVar: "", keyUrl: "", description: "Local models — no API key needed" },
    { name: "lmstudio", displayName: "LM Studio", envVar: "", keyUrl: "", description: "Local models via LM Studio" },
    { name: "browserai", displayName: "Browser AI", envVar: "", keyUrl: "", description: "Browser-based local inference (WebGPU)" },
];

// ── Print helpers ────────────────────────────────────────────────────────────

export function printSuccess(msg: string): void {
    console.log(`  ${c.green}✓${c.reset} ${msg}`);
}

export function printSkipped(msg: string): void {
    console.log(`  ${c.dim}⊘ ${msg}${c.reset}`);
}
