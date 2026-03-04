// src/setup/env-helpers.ts — .env, vault key, config file, and secret-migration helpers.

import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { setSecret, getSecret } from "@/secrets/vault.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = resolve(__dirname, "..", "..");
export const ENV_FILE = resolve(ROOT, ".env");
export const CONFIG_FILE = resolve(__dirname, "..", "forkscout.config.json");
export const AGENTS_DIR = resolve(ROOT, ".agents");

// ── .env read/write ──────────────────────────────────────────────────────────

export function loadEnvFile(): Map<string, string> {
    const map = new Map<string, string>();
    if (!existsSync(ENV_FILE)) return map;
    const lines = readFileSync(ENV_FILE, "utf-8").split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        map.set(key, value);
    }
    return map;
}

export function saveEnvFile(vars: Map<string, string>): void {
    const lines: string[] = [
        "# ForkScout environment — ONLY vault key lives here",
        "# All secrets are in .agents/vault.enc.json (encrypted)",
        "# Do NOT put API keys here — use 'bun run setup' instead",
        "",
    ];
    for (const [key, value] of vars) {
        const needsQuotes = /[\s#\"'$\\]/.test(value);
        lines.push(`${key}=${needsQuotes ? `"${value}"` : value}`);
    }
    lines.push("");
    writeFileSync(ENV_FILE, lines.join("\n"), "utf-8");
}

// ── VAULT_KEY generation ─────────────────────────────────────────────────────

export function ensureVaultKey(envVars: Map<string, string>): { vaultKey: string; generated: boolean } {
    const fromEnv = process.env.VAULT_KEY;
    if (fromEnv) return { vaultKey: fromEnv, generated: false };

    const fromFile = envVars.get("VAULT_KEY");
    if (fromFile) {
        process.env.VAULT_KEY = fromFile;
        return { vaultKey: fromFile, generated: false };
    }

    const newKey = randomBytes(32).toString("hex");
    process.env.VAULT_KEY = newKey;
    return { vaultKey: newKey, generated: true };
}

// ── Secret detection & migration ─────────────────────────────────────────────

const SECRET_PATTERN = /KEY|TOKEN|SECRET|PASSWORD|SID|AUTH/i;

export function isSecretVar(name: string): boolean {
    return SECRET_PATTERN.test(name);
}

/** Migrate secrets from .env to vault. Returns count of migrated secrets. */
export function migrateEnvSecretsToVault(envVars: Map<string, string>): number {
    let count = 0;
    const toRemove: string[] = [];
    for (const [key, value] of envVars) {
        if (key === "VAULT_KEY") continue;
        if (!isSecretVar(key) || !value) continue;
        if (!getSecret(key)) { setSecret(key, value); count++; }
        toRemove.push(key);
    }
    for (const key of toRemove) envVars.delete(key);
    return count;
}

// ── Config file helpers ──────────────────────────────────────────────────────

export function loadConfigFile(): any {
    if (!existsSync(CONFIG_FILE)) return null;
    try { return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")); } catch { return null; }
}

export function saveConfigFile(config: any): void {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4) + "\n", "utf-8");
}
