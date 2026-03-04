// src/setup/step-speech.ts — Speech (TTS + STT) configuration step.

import { select, input } from "@inquirer/prompts";
import { c, printSuccess } from "@/setup/shared.ts";
import { loadConfigFile, saveConfigFile } from "@/setup/env-helpers.ts";

const PROVIDERS = ["elevenlabs", "openai", "google", "openrouter"] as const;

const TTS_MODELS: Record<string, string[]> = {
    elevenlabs: ["eleven_multilingual_v2", "eleven_turbo_v2_5", "eleven_flash_v2_5"],
    openai: ["tts-1", "tts-1-hd", "gpt-4o-audio-preview", "gpt-4o-mini-audio-preview"],
    google: ["standard", "wavenet", "studio_multispeaker"],
    openrouter: ["elevenlabs/eleven_multilingual_v2", "openai/tts-1"],
};

const TTS_DEFAULT_VOICE: Record<string, string> = {
    elevenlabs: "21m00Tcm4TlvDq8ikWAM",  // Rachel
    openai: "nova",
    google: "en-US-Studio-M",
    openrouter: "",
};

const STT_MODELS: Record<string, string[]> = {
    elevenlabs: ["scribe_v1", "scribe_v1_experimental"],
    openai: ["whisper-1", "gpt-4o-transcribe", "gpt-4o-mini-transcribe"],
    google: ["latest_long", "latest_short", "telephony"],
    openrouter: ["openai/whisper-1"],
};

function getDefaults() {
    return {
        enabled: false, ttsProvider: "elevenlabs", ttsModel: "eleven_multilingual_v2",
        ttsVoice: "21m00Tcm4TlvDq8ikWAM", sttProvider: "elevenlabs", sttModel: "scribe_v1", language: "en"
    };
}

function save(s: any): void { const cfg = loadConfigFile() ?? {}; cfg.speech = s; saveConfigFile(cfg); }

const mk = (label: string, val: string | boolean) =>
    `${label.padEnd(16)} ${typeof val === "boolean" ? (val ? `${c.green}✓ enabled${c.reset}` : `${c.dim}○ disabled${c.reset}`) : `${c.dim}${val}${c.reset}`}`;

export async function stepSpeech(): Promise<void> {
    console.log(`${c.cyan}${c.bold}  Speech (TTS/STT)${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}\n`);

    while (true) {
        const s = (loadConfigFile()?.speech) ?? getDefaults();

        const field = await select<string>({
            message: "Speech settings",
            pageSize: 20,
            choices: [
                { value: "__back__", name: `${c.green}← Done${c.reset}     ${c.dim}save & return${c.reset}` },
                { value: "enabled", name: mk("Enabled", s.enabled) },
                { value: "ttsProvider", name: mk("TTS Provider", s.ttsProvider) },
                { value: "ttsModel", name: mk("TTS Model", s.ttsModel) },
                { value: "ttsVoice", name: mk("TTS Voice", s.ttsVoice) },
                { value: "sttProvider", name: mk("STT Provider", s.sttProvider) },
                { value: "sttModel", name: mk("STT Model", s.sttModel) },
                { value: "language", name: mk("Language", s.language) },
            ],
        });

        if (field === "__back__") { console.log(""); return; }

        const cur = (list: string[]) => list.map(m => ({ value: m, name: m === s[field as keyof typeof s] ? `${c.green}${c.bold}${m}${c.reset} ${c.dim}← current${c.reset}` : m }));

        if (field === "enabled") {
            s.enabled = (await select<string>({
                message: "Enable speech?", pageSize: 4, choices: [
                    { value: "true", name: `${c.green}Yes${c.reset}  — enable TTS & STT` },
                    { value: "false", name: `${c.dim}No   — disable${c.reset}` },
                ]
            })) === "true";
        } else if (field === "ttsProvider") {
            s.ttsProvider = await select<string>({ message: "TTS Provider", pageSize: 6, choices: cur(PROVIDERS as unknown as string[]) });
            s.ttsModel = TTS_MODELS[s.ttsProvider]?.[0] ?? "";
            s.ttsVoice = TTS_DEFAULT_VOICE[s.ttsProvider] ?? "";
        } else if (field === "ttsModel") {
            const v = await select<string>({ message: "TTS Model", pageSize: 8, choices: [...cur(TTS_MODELS[s.ttsProvider] ?? []), { value: "__manual__", name: `${c.magenta}✏ Enter manually${c.reset}` }] });
            s.ttsModel = v === "__manual__" ? (await input({ message: "TTS model ID:", default: s.ttsModel })) : v;
        } else if (field === "ttsVoice") {
            s.ttsVoice = await input({ message: "TTS Voice ID:", default: s.ttsVoice });
        } else if (field === "sttProvider") {
            s.sttProvider = await select<string>({ message: "STT Provider", pageSize: 6, choices: cur(PROVIDERS as unknown as string[]) });
            s.sttModel = STT_MODELS[s.sttProvider]?.[0] ?? "";
        } else if (field === "sttModel") {
            const v = await select<string>({ message: "STT Model", pageSize: 8, choices: [...cur(STT_MODELS[s.sttProvider] ?? []), { value: "__manual__", name: `${c.magenta}✏ Enter manually${c.reset}` }] });
            s.sttModel = v === "__manual__" ? (await input({ message: "STT model ID:", default: s.sttModel })) : v;
        } else if (field === "language") {
            s.language = await input({ message: "Language code (e.g. en, hi, fr, es):", default: s.language });
        }

        save(s);
        printSuccess("Saved");
    }
}
