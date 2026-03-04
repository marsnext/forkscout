// src/setup/setup-whatsapp.ts — WhatsApp inline QR pairing during setup wizard.
// If already paired → shows account details + edit/reset options.
// If not paired → starts Baileys, renders QR in terminal, waits for scan.

import { select, input } from "@inquirer/prompts";
import { existsSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import {
    makeWASocket, useMultiFileAuthState, DisconnectReason,
    Browsers, fetchLatestBaileysVersion, makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { getSecret, setSecret } from "@/secrets/vault.ts";
import { c, printSuccess, printSkipped } from "@/setup/shared.ts";

const SESSION_DIR = resolve(process.cwd(), ".agents/whatsapp-sessions");
const CREDS_FILE = resolve(SESSION_DIR, "creds.json");

// ── Account details (from creds.json) ────────────────────────────────────────

interface WACreds { registered?: boolean; me?: { id?: string; name?: string }; platform?: string }

function readCreds(): WACreds | null {
    try { return JSON.parse(readFileSync(CREDS_FILE, "utf-8")); } catch { return null; }
}

function formatPhone(jid: string): string {
    // "919876046092:3@s.whatsapp.net" → "+91 98760 46092"
    const num = jid.split(":")[0]?.split("@")[0] ?? jid;
    if (num.length >= 10) return `+${num.slice(0, 2)} ${num.slice(2, 7)} ${num.slice(7)}`;
    return `+${num}`;
}

// ── Public entry point ───────────────────────────────────────────────────────

export async function setupWhatsApp(): Promise<void> {
    const creds = existsSync(CREDS_FILE) ? readCreds() : null;
    const paired = !!creds?.me?.id;

    if (paired) {
        await showAccountDetails(creds!);
    } else {
        await startQrPairing();
    }
}

// ── Already paired — show details + edit ─────────────────────────────────────

async function showAccountDetails(creds: WACreds): Promise<void> {
    const phone = creds.me?.id ? formatPhone(creds.me.id) : "unknown";
    const name = creds.me?.name ?? "unknown";
    const platform = creds.platform ?? "unknown";
    const ownerJids = getSecret("WHATSAPP_OWNER_JIDS");

    console.log(`  ${c.green}✓${c.reset} ${c.bold}WhatsApp connected${c.reset}`);
    console.log(`    ${c.dim}Name:${c.reset}     ${name}`);
    console.log(`    ${c.dim}Phone:${c.reset}    ${phone}`);
    console.log(`    ${c.dim}Platform:${c.reset} ${platform}`);
    if (ownerJids) console.log(`    ${c.dim}Owners:${c.reset}   ${ownerJids}`);
    console.log("");

    const choices = [
        { value: "back", name: `${c.green}${c.bold}← Back${c.reset}       ${c.dim}— return to channels${c.reset}` },
        { value: "owner_jids", name: `${c.bold}${ownerJids ? "Edit" : "Set"} owner JIDs${c.reset} ${c.dim}— who gets full access${c.reset}` },
        { value: "reconnect", name: `${c.bold}Re-pair${c.reset}       ${c.dim}— delete session & scan new QR${c.reset}` },
    ];

    const action = await select<string>({ message: "What would you like to do?", pageSize: 20, choices });
    if (action === "back") { console.log(""); return; }

    console.log("");
    if (action === "owner_jids") {
        await askOwnerJids();
    } else if (action === "reconnect") {
        if (existsSync(SESSION_DIR)) rmSync(SESSION_DIR, { recursive: true, force: true });
        printSuccess("Session deleted.");
        console.log("");
        await startQrPairing();
    }
    console.log("");
}

// ── QR pairing flow ──────────────────────────────────────────────────────────

async function startQrPairing(): Promise<void> {
    console.log(`  ${c.cyan}Connecting to WhatsApp — scan the QR code with your phone...${c.reset}`);
    console.log(`  ${c.dim}(Open WhatsApp → Settings → Linked Devices → Link a Device)${c.reset}\n`);

    if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });

    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // Minimal silent logger for Baileys
    const noop = () => { };
    const silentLogger = {
        level: "silent", info: noop, warn: noop, error: noop, debug: noop,
        trace: noop, fatal: noop, child: () => silentLogger
    } as any;

    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, silentLogger) },
        version, logger: silentLogger, browser: Browsers.macOS("ForkScout"),
        syncFullHistory: false, markOnlineOnConnect: false,
        getMessage: async () => undefined,
    });

    const result = await new Promise<{ ok: boolean; jid?: string; name?: string }>((done) => {
        const timeout = setTimeout(() => {
            sock.end(undefined); done({ ok: false });
        }, 120_000); // 2 min timeout

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                try {
                    const qrText = await QRCode.toString(qr, { type: "terminal", small: true });
                    console.log(qrText);
                } catch {
                    console.log(`  ${c.dim}QR data: ${qr}${c.reset}`);
                }
            }

            if (connection === "open") {
                clearTimeout(timeout);
                const jid = sock.user?.id ?? "";
                const name = sock.user?.name ?? "";
                sock.end(undefined);
                done({ ok: true, jid, name });
                return;
            }

            if (connection === "close") {
                const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
                if (reason === DisconnectReason.restartRequired) {
                    // Pairing succeeded — Baileys needs a reconnect to finalize
                    clearTimeout(timeout);
                    sock.end(undefined);
                    done({ ok: true, jid: sock.user?.id ?? "", name: sock.user?.name ?? "" });
                } else {
                    clearTimeout(timeout);
                    sock.end(undefined);
                    done({ ok: false });
                }
            }
        });
    });

    if (result.ok) {
        const phone = result.jid ? formatPhone(result.jid) : "";
        console.log("");
        printSuccess(`WhatsApp paired successfully!${phone ? ` (${phone})` : ""}${result.name ? ` — ${result.name}` : ""}`);
        console.log("");
        await askOwnerJids();
    } else {
        console.log(`\n  ${c.yellow}⚠ QR expired or pairing failed. Try again from the channels menu.${c.reset}`);
    }
    console.log("");
}

// ── Owner JIDs ───────────────────────────────────────────────────────────────

async function askOwnerJids(): Promise<void> {
    const existing = getSecret("WHATSAPP_OWNER_JIDS");
    if (existing) console.log(`  ${c.dim}Current: ${existing}${c.reset}\n`);

    console.log(`  ${c.dim}JID format: <phone>@s.whatsapp.net  (e.g. 919876543210@s.whatsapp.net)${c.reset}`);
    console.log(`  ${c.dim}Comma-separated for multiple.${c.reset}\n`);

    const jids = await input({ message: "Owner JIDs (Enter to skip)", default: existing ?? "" });
    if (jids) {
        setSecret("WHATSAPP_OWNER_JIDS", jids);
        printSuccess(`Owner JIDs saved to ${c.bold}encrypted vault${c.reset}`);
    }
}
