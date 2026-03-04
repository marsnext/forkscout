// src/channels/whatsapp/baileys-logger.ts — Silent pino-compatible logger for Baileys
//
// Baileys expects an ILogger with pino-style methods. We suppress all output
// since Baileys is extremely verbose. Our own logger handles user-facing logs.
//
// Also patches console.info/warn to suppress libsignal's hardcoded console logs
// (e.g. "Closing session:", "Opening session:", "Session already closed").

import type { ILogger } from "@whiskeysockets/baileys/lib/Utils/logger.js";

const noop = () => { };

/** Create a silent ILogger that satisfies Baileys' requirements. */
export function makeSilentLogger(): ILogger {
    const logger: ILogger = {
        level: "silent",
        child: () => logger,
        trace: noop,
        debug: noop,
        info: noop,
        warn: noop,
        error: noop,
    };
    return logger;
}

// ── Suppress libsignal's hardcoded console.info/warn ─────────────────────────
// libsignal/src/session_record.js uses console.info("Closing session:", ...)
// and console.warn("Session already closed", ...) directly — no way to configure.

const SIGNAL_NOISE = /session|Session/;
const _origInfo = console.info;
const _origWarn = console.warn;

console.info = (...args: any[]) => {
    if (typeof args[0] === "string" && SIGNAL_NOISE.test(args[0])) return;
    _origInfo.apply(console, args);
};

console.warn = (...args: any[]) => {
    if (typeof args[0] === "string" && SIGNAL_NOISE.test(args[0])) return;
    _origWarn.apply(console, args);
};
