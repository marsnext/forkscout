// src/setup/step-image-gen.ts — Image generation configuration step.

import { select, input } from "@inquirer/prompts";
import { c, printSuccess } from "@/setup/shared.ts";
import { loadConfigFile, saveConfigFile } from "@/setup/env-helpers.ts";

const PROVIDERS = ["openai", "replicate", "together", "fireworks", "deepinfra", "bfl"] as const;

const MODELS: Record<string, string[]> = {
    openai: ["dall-e-3", "gpt-image-1", "dall-e-2"],
    replicate: ["black-forest-labs/flux-1.1-pro", "black-forest-labs/flux-schnell", "stability-ai/sdxl"],
    together: ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-3-5-large"],
    fireworks: ["accounts/fireworks/models/flux-1-schnell", "accounts/fireworks/models/playground-v2-5-1024px-aesthetic"],
    deepinfra: ["black-forest-labs/FLUX-1-schnell", "stabilityai/stable-diffusion-xl-base-1.0"],
    bfl: ["flux-kontext-max", "flux-1.1-pro", "flux-1.1-pro-ultra"],
};

const SIZES = ["1024x1024", "1792x1024", "1024x1792", "512x512", "768x768", "2048x2048"];
const QUALITIES = ["standard", "hd"] as const;
const STYLES = ["vivid", "natural"] as const;

function getDefaults() {
    return {
        enabled: false, provider: "openai", model: "dall-e-3",
        defaultSize: "1024x1024", defaultQuality: "hd", defaultStyle: "vivid"
    };
}

function save(s: any): void { const cfg = loadConfigFile() ?? {}; cfg.imageGeneration = s; saveConfigFile(cfg); }

const mk = (label: string, val: any) => `${label.padEnd(18)} ${c.dim}${val}${c.reset}`;

export async function stepImageGen(): Promise<void> {
    console.log(`${c.cyan}${c.bold}  Image Generation${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}\n`);

    while (true) {
        const s = (loadConfigFile()?.imageGeneration) ?? getDefaults();
        const on = s.enabled ? `${c.green}✓ enabled${c.reset}` : `${c.dim}○ disabled${c.reset}`;

        const field = await select<string>({
            message: "Image generation settings",
            pageSize: 20,
            choices: [
                { value: "__back__", name: `${c.green}← Done${c.reset}     ${c.dim}save & return${c.reset}` },
                { value: "enabled", name: `${"Enabled".padEnd(18)} ${on}` },
                { value: "provider", name: mk("Provider", s.provider) },
                { value: "model", name: mk("Model", s.model) },
                { value: "size", name: mk("Default size", s.defaultSize) },
                { value: "quality", name: mk("Quality", s.defaultQuality) },
                { value: "style", name: mk("Style (DALL-E)", s.defaultStyle ?? "none") },
            ],
        });

        if (field === "__back__") { console.log(""); return; }

        const cur = (list: string[], key: string) => list.map(m => ({ value: m, name: m === (s as any)[key] ? `${c.green}${c.bold}${m}${c.reset} ${c.dim}← current${c.reset}` : m }));

        if (field === "enabled") {
            s.enabled = (await select<string>({
                message: "Enable image generation?", pageSize: 4, choices: [
                    { value: "true", name: `${c.green}Yes${c.reset}  — enable AI image creation` },
                    { value: "false", name: `${c.dim}No   — disable${c.reset}` },
                ]
            })) === "true";
        } else if (field === "provider") {
            s.provider = await select<string>({
                message: "Image provider", pageSize: 8,
                choices: cur(PROVIDERS as unknown as string[], "provider")
            });
            s.model = MODELS[s.provider]?.[0] ?? s.model;
        } else if (field === "model") {
            const v = await select<string>({
                message: "Image model", pageSize: 10,
                choices: [...cur(MODELS[s.provider] ?? [], "model"), { value: "__manual__", name: `${c.magenta}✏ Enter manually${c.reset}` }]
            });
            s.model = v === "__manual__" ? (await input({ message: "Model ID:", default: s.model })) : v;
        } else if (field === "size") {
            const v = await select<string>({
                message: "Default image size", pageSize: 8,
                choices: [...cur(SIZES, "defaultSize"), { value: "__manual__", name: `${c.magenta}✏ Custom WxH${c.reset}` }]
            });
            s.defaultSize = v === "__manual__" ? (await input({ message: "Size (WxH):", default: s.defaultSize })) : v;
        } else if (field === "quality") {
            s.defaultQuality = await select<any>({
                message: "Image quality", pageSize: 4,
                choices: cur(QUALITIES as unknown as string[], "defaultQuality")
            });
        } else if (field === "style") {
            const v = await select<string>({
                message: "Image style (DALL-E 3)", pageSize: 4,
                choices: [...cur(STYLES as unknown as string[], "defaultStyle"), { value: "none", name: `${c.dim}none — no style${c.reset}` }]
            });
            if (v === "none") delete (s as any).defaultStyle; else s.defaultStyle = v;
        }

        save(s);
        printSuccess("Saved");
    }
}
