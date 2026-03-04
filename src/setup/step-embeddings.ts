// src/setup/step-embeddings.ts — Embeddings configuration step.

import { select, input } from "@inquirer/prompts";
import { c, printSuccess } from "@/setup/shared.ts";
import { loadConfigFile, saveConfigFile } from "@/setup/env-helpers.ts";

const PROVIDERS = ["openrouter", "openai", "google", "together", "deepinfra"] as const;

const MODELS: Record<string, string[]> = {
    openrouter: ["openai/text-embedding-3-small", "openai/text-embedding-3-large", "google/text-embedding-004"],
    openai: ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"],
    google: ["text-embedding-004", "textembedding-gecko@003"],
    together: ["togethercomputer/m2-bert-80M-8k-retrieval", "BAAI/bge-large-en-v1.5"],
    deepinfra: ["BAAI/bge-large-en-v1.5", "thenlper/gte-large", "intfloat/e5-large-v2"],
};

function getDefaults() {
    return { enabled: false, provider: "openrouter", model: "openai/text-embedding-3-small", topK: 5, chunkMaxTokens: 500 };
}

function save(s: any): void { const cfg = loadConfigFile() ?? {}; cfg.embeddings = s; saveConfigFile(cfg); }

const mk = (label: string, val: any) => `${label.padEnd(20)} ${c.dim}${val}${c.reset}`;

export async function stepEmbeddings(): Promise<void> {
    console.log(`${c.cyan}${c.bold}  Embeddings${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}\n`);

    while (true) {
        const s = (loadConfigFile()?.embeddings) ?? getDefaults();
        const on = s.enabled ? `${c.green}✓ enabled${c.reset}` : `${c.dim}○ disabled${c.reset}`;

        const field = await select<string>({
            message: "Embedding settings",
            pageSize: 20,
            choices: [
                { value: "__back__", name: `${c.green}← Done${c.reset}     ${c.dim}save & return${c.reset}` },
                { value: "enabled", name: `${"Enabled".padEnd(20)} ${on}` },
                { value: "provider", name: mk("Provider", s.provider) },
                { value: "model", name: mk("Model", s.model) },
                { value: "topK", name: mk("Top-K results", s.topK) },
                { value: "chunkMaxTokens", name: mk("Chunk max tokens", s.chunkMaxTokens) },
            ],
        });

        if (field === "__back__") { console.log(""); return; }

        const cur = (list: string[], key: string) => list.map(m => ({ value: m, name: m === (s as any)[key] ? `${c.green}${c.bold}${m}${c.reset} ${c.dim}← current${c.reset}` : m }));

        if (field === "enabled") {
            s.enabled = (await select<string>({
                message: "Enable embeddings?", pageSize: 4, choices: [
                    { value: "true", name: `${c.green}Yes${c.reset}  — semantic memory & search` },
                    { value: "false", name: `${c.dim}No   — disable${c.reset}` },
                ]
            })) === "true";
        } else if (field === "provider") {
            s.provider = await select<string>({
                message: "Embeddings provider", pageSize: 8,
                choices: cur(PROVIDERS as unknown as string[], "provider")
            });
            s.model = MODELS[s.provider]?.[0] ?? s.model;
        } else if (field === "model") {
            const v = await select<string>({
                message: "Embedding model", pageSize: 10,
                choices: [...cur(MODELS[s.provider] ?? [], "model"), { value: "__manual__", name: `${c.magenta}✏ Enter manually${c.reset}` }]
            });
            s.model = v === "__manual__" ? (await input({ message: "Model ID:", default: s.model })) : v;
        } else if (field === "topK") {
            const v = await input({
                message: "Top-K nearest results (e.g. 5):", default: String(s.topK),
                validate: v => isNaN(+v) || +v < 1 ? "Enter a positive number" : true
            });
            s.topK = parseInt(v);
        } else if (field === "chunkMaxTokens") {
            const v = await input({
                message: "Max tokens per chunk (e.g. 500):", default: String(s.chunkMaxTokens),
                validate: v => isNaN(+v) || +v < 50 ? "Enter a number ≥ 50" : true
            });
            s.chunkMaxTokens = parseInt(v);
        }

        save(s);
        printSuccess("Saved");
    }
}
