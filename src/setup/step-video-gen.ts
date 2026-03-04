// src/setup/step-video-gen.ts — Video generation configuration step.

import { select, input } from "@inquirer/prompts";
import { c, printSuccess } from "@/setup/shared.ts";
import { loadConfigFile, saveConfigFile } from "@/setup/env-helpers.ts";

const PROVIDERS = ["replicate", "minimax", "runway", "kling", "pika"] as const;

const MODELS: Record<string, string[]> = {
    replicate: ["minimax/video-01-live", "minimax/video-01", "luma/ray2", "stability-ai/stable-video-diffusion"],
    minimax: ["video-01", "video-01-live"],
    runway: ["gen4_turbo", "gen4"],
    kling: ["kling-v2-pro", "kling-v1.6-pro", "kling-v1.6-standard"],
    pika: ["v2.2", "v2", "v1.5"],
};

const RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"] as const;

function getDefaults() {
    return {
        enabled: false, provider: "replicate", model: "minimax/video-01-live",
        defaultDuration: 5, defaultAspectRatio: "16:9"
    };
}

function save(s: any): void { const cfg = loadConfigFile() ?? {}; cfg.videoGeneration = s; saveConfigFile(cfg); }

const mk = (label: string, val: any) => `${label.padEnd(20)} ${c.dim}${val}${c.reset}`;

export async function stepVideoGen(): Promise<void> {
    console.log(`${c.cyan}${c.bold}  Video Generation${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}\n`);

    while (true) {
        const s = (loadConfigFile()?.videoGeneration) ?? getDefaults();
        const on = s.enabled ? `${c.green}✓ enabled${c.reset}` : `${c.dim}○ disabled${c.reset}`;

        const field = await select<string>({
            message: "Video generation settings",
            pageSize: 20,
            choices: [
                { value: "__back__", name: `${c.green}← Done${c.reset}     ${c.dim}save & return${c.reset}` },
                { value: "enabled", name: `${"Enabled".padEnd(20)} ${on}` },
                { value: "provider", name: mk("Provider", s.provider) },
                { value: "model", name: mk("Model", s.model) },
                { value: "duration", name: mk("Duration (sec)", s.defaultDuration ?? 5) },
                { value: "ratio", name: mk("Aspect ratio", s.defaultAspectRatio ?? "16:9") },
            ],
        });

        if (field === "__back__") { console.log(""); return; }

        const cur = (list: string[], key: string) => list.map(m => ({ value: m, name: m === (s as any)[key] ? `${c.green}${c.bold}${m}${c.reset} ${c.dim}← current${c.reset}` : m }));

        if (field === "enabled") {
            s.enabled = (await select<string>({
                message: "Enable video generation?", pageSize: 4, choices: [
                    { value: "true", name: `${c.green}Yes${c.reset}  — enable AI video creation` },
                    { value: "false", name: `${c.dim}No   — disable${c.reset}` },
                ]
            })) === "true";
        } else if (field === "provider") {
            s.provider = await select<string>({
                message: "Video provider", pageSize: 8,
                choices: cur(PROVIDERS as unknown as string[], "provider")
            });
            s.model = MODELS[s.provider]?.[0] ?? s.model;
        } else if (field === "model") {
            const v = await select<string>({
                message: "Video model", pageSize: 8,
                choices: [...cur(MODELS[s.provider] ?? [], "model"), { value: "__manual__", name: `${c.magenta}✏ Enter manually${c.reset}` }]
            });
            s.model = v === "__manual__" ? (await input({ message: "Model ID:", default: s.model })) : v;
        } else if (field === "duration") {
            const v = await input({
                message: "Default duration in seconds:", default: String(s.defaultDuration ?? 5),
                validate: v => isNaN(+v) || +v < 1 ? "Enter a positive number" : true
            });
            s.defaultDuration = parseInt(v);
        } else if (field === "ratio") {
            const v = await select<string>({
                message: "Default aspect ratio", pageSize: 8,
                choices: [...cur(RATIOS as unknown as string[], "defaultAspectRatio"), { value: "__manual__", name: `${c.magenta}✏ Enter custom${c.reset}` }]
            });
            s.defaultAspectRatio = v === "__manual__" ? (await input({ message: "Ratio (e.g. 16:9):", default: s.defaultAspectRatio })) : v;
        }

        save(s);
        printSuccess("Saved");
    }
}
