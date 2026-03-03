export interface ProviderMeta {
    name: string;
    slug: string;
    tier: string;
    color: string;
    logo: string;
    website: string;
    docs: string;
    description: string;
}

export const providers: ProviderMeta[] = [
    {
        name: "OpenRouter",
        slug: "openrouter",
        tier: "9 providers via 1 key",
        color: "purple",
        logo: "https://openrouter.ai/favicon.ico",
        website: "https://openrouter.ai",
        docs: "https://openrouter.ai/docs",
        description: "Unified API gateway to access 200+ LLMs from every major provider through a single API key.",
    },
    {
        name: "Anthropic",
        slug: "anthropic",
        tier: "Claude Opus / Sonnet / Haiku",
        color: "amber",
        logo: "https://www.anthropic.com/favicon.ico",
        website: "https://www.anthropic.com",
        docs: "https://docs.anthropic.com",
        description: "Creators of Claude — safety-focused AI models with strong reasoning and long-context support.",
    },
    {
        name: "Google",
        slug: "google",
        tier: "Gemini 2.5 Pro / Flash",
        color: "blue",
        logo: "https://www.google.com/s2/favicons?domain=ai.google.dev&sz=64",
        website: "https://ai.google.dev",
        docs: "https://ai.google.dev/docs",
        description: "Google's Gemini family — multimodal models with massive context windows and tool use.",
    },
    {
        name: "xAI",
        slug: "xai",
        tier: "Grok 3",
        color: "rose",
        logo: "https://x.ai/favicon.ico",
        website: "https://x.ai",
        docs: "https://docs.x.ai",
        description: "Elon Musk's AI lab building Grok — fast, witty, real-time knowledge from X.",
    },
    {
        name: "DeepSeek",
        slug: "deepseek",
        tier: "Chat / Reasoner",
        color: "cyan",
        logo: "https://www.deepseek.com/favicon.ico",
        website: "https://www.deepseek.com",
        docs: "https://platform.deepseek.com/docs",
        description: "Open-source focused LLMs with strong coding and reasoning at fraction of the cost.",
    },
    {
        name: "Perplexity",
        slug: "perplexity",
        tier: "Sonar / Sonar Pro",
        color: "violet",
        logo: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64",
        website: "https://www.perplexity.ai",
        docs: "https://docs.perplexity.ai",
        description: "AI-powered search engine models with real-time web access and cited answers.",
    },
    {
        name: "Replicate",
        slug: "replicate",
        tier: "Llama 3.1 405B",
        color: "emerald",
        logo: "https://www.google.com/s2/favicons?domain=replicate.com&sz=64",
        website: "https://replicate.com",
        docs: "https://replicate.com/docs",
        description: "Run open-source models in the cloud with simple API calls and auto-scaling.",
    },
    {
        name: "HuggingFace",
        slug: "huggingface",
        tier: "Llama 3.3 70B",
        color: "yellow",
        logo: "https://huggingface.co/favicon.ico",
        website: "https://huggingface.co",
        docs: "https://huggingface.co/docs",
        description: "The open-source AI community hub — hosting 500K+ models with inference API.",
    },
    {
        name: "ElevenLabs",
        slug: "elevenlabs",
        tier: "TTS + STT",
        color: "pink",
        logo: "https://elevenlabs.io/favicon.ico",
        website: "https://elevenlabs.io",
        docs: "https://docs.elevenlabs.io",
        description: "Best-in-class voice AI — text-to-speech, speech-to-text, and voice cloning.",
    },
];

export const badgeStyle: Record<string, string> = {
    purple: "border-purple-500/25 bg-purple-500/8 text-purple-600 hover:bg-purple-500/15 dark:text-purple-400",
    amber: "border-amber-500/25 bg-amber-500/8 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400",
    blue: "border-blue-500/25 bg-blue-500/8 text-blue-600 hover:bg-blue-500/15 dark:text-blue-400",
    rose: "border-rose-500/25 bg-rose-500/8 text-rose-600 hover:bg-rose-500/15 dark:text-rose-400",
    cyan: "border-cyan-500/25 bg-cyan-500/8 text-cyan-600 hover:bg-cyan-500/15 dark:text-cyan-400",
    violet: "border-violet-500/25 bg-violet-500/8 text-violet-600 hover:bg-violet-500/15 dark:text-violet-400",
    emerald: "border-emerald-500/25 bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400",
    yellow: "border-yellow-500/25 bg-yellow-500/8 text-yellow-600 hover:bg-yellow-500/15 dark:text-yellow-400",
    pink: "border-pink-500/25 bg-pink-500/8 text-pink-600 hover:bg-pink-500/15 dark:text-pink-400",
};
