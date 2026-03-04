// src/setup/format-model.ts — Format model metadata (modality badge + pricing) for terminal display.

import { c } from "@/setup/shared.ts";
import type { ModelEntry, ModelModality } from "@/setup/fetch-models.ts";

// ── Modality badge colors ────────────────────────────────────────────────────

const MODALITY_STYLE: Record<ModelModality, { badge: string; color: string }> = {
    language: { badge: "LLM", color: "\x1b[36m" },  // cyan
    image: { badge: "IMG", color: "\x1b[35m" },  // magenta
    video: { badge: "VID", color: "\x1b[33m" },  // yellow
    embedding: { badge: "EMB", color: "\x1b[34m" },  // blue
    audio: { badge: "AUD", color: "\x1b[32m" },  // green
    unknown: { badge: "???", color: "\x1b[2m" },  // dim
};

// ── Price formatter ──────────────────────────────────────────────────────────

/** Format per-token price to $/M tokens (e.g. "0.000003" → "$3.00") */
function perMillion(raw: string | undefined): string | null {
    if (!raw) return null;
    const n = parseFloat(raw);
    if (isNaN(n) || n === 0) return null;
    const perM = n * 1_000_000;
    // Show 2 decimals, but drop trailing zeros
    return `$${perM < 0.01 ? perM.toPrecision(2) : perM.toFixed(2).replace(/\.?0+$/, "")}`;
}

/** Format image price (per image, e.g. "0.08" → "$0.08/img") */
function perImage(raw: string | undefined): string | null {
    if (!raw) return null;
    const n = parseFloat(raw);
    if (isNaN(n) || n === 0) return null;
    return `$${n}/img`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Format a single model's modality + pricing for display in the terminal picker.
 * Returns a compact colored string like:  [LLM] $3/$15  or  [IMG] $0.08/img
 * Returns empty string if no metadata available.
 */
export function formatModelLine(model: ModelEntry): string {
    const parts: string[] = [];

    // Modality badge
    if (model.modality) {
        const s = MODALITY_STYLE[model.modality] ?? MODALITY_STYLE.unknown;
        parts.push(`${s.color}[${s.badge}]${c.reset}`);
    }

    // Pricing
    const p = model.pricing;
    if (p) {
        if (p.image) {
            const img = perImage(p.image);
            if (img) parts.push(`${c.dim}${img}${c.reset}`);
        } else {
            const inp = perMillion(p.input);
            const out = perMillion(p.output);
            if (inp && out) {
                parts.push(`${c.dim}${inp}/${out}${c.reset}`);
            } else if (inp) {
                parts.push(`${c.dim}${inp}${c.reset}`);
            }
        }
    }

    // Context window (compact, only for large or notable sizes)
    if (model.contextWindow && model.contextWindow >= 1000) {
        const ctx = model.contextWindow >= 1_000_000
            ? `${(model.contextWindow / 1_000_000).toFixed(model.contextWindow % 1_000_000 === 0 ? 0 : 1)}M`
            : `${Math.round(model.contextWindow / 1000)}K`;
        parts.push(`${c.dim}${ctx}${c.reset}`);
    }

    return parts.length > 0 ? parts.join(" ") : "";
}
