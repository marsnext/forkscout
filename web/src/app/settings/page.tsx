"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@web/components/navbar";
import { useAuth } from "@web/lib/auth-context";
import {
    getConfig as fetchConfig,
    saveConfig,
} from "@web/lib/api";
import {
    Settings2,
    Save,
    RefreshCw,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Code2,
    Sliders,
} from "lucide-react";

type ViewMode = "visual" | "json";

export default function SettingsPage() {
    const { token, isAuthenticated } = useAuth();
    const [config, setConfig] = useState<Record<string, unknown> | null>(null);
    const [jsonText, setJsonText] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("visual");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [dirty, setDirty] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchConfig(token);
            setConfig(data);
            setJsonText(JSON.stringify(data, null, 4));
            setDirty(false);
            setStatus(null);
        } catch (err: any) {
            setStatus({ type: "error", msg: err.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    // Clear status after 4s
    useEffect(() => {
        if (!status) return;
        const t = setTimeout(() => setStatus(null), 4000);
        return () => clearTimeout(t);
    }, [status]);

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const toSave = viewMode === "json" ? JSON.parse(jsonText) : config;
            await saveConfig(token, toSave as Record<string, unknown>);
            setConfig(toSave as Record<string, unknown>);
            setJsonText(JSON.stringify(toSave, null, 4));
            setDirty(false);
            setStatus({ type: "success", msg: "Config saved — hot-reload applied." });
        } catch (err: any) {
            setStatus({ type: "error", msg: err.message });
        } finally {
            setSaving(false);
        }
    };

    // Helper to update a nested config path
    const updateField = (path: string[], value: unknown) => {
        if (!config) return;
        const next = structuredClone(config);
        let obj: any = next;
        for (let i = 0; i < path.length - 1; i++) {
            if (!(path[i] in obj)) obj[path[i]] = {};
            obj = obj[path[i]];
        }
        obj[path[path.length - 1]] = value;
        setConfig(next);
        setJsonText(JSON.stringify(next, null, 4));
        setDirty(true);
    };

    const get = (path: string[]): unknown => {
        if (!config) return undefined;
        let obj: any = config;
        for (const key of path) {
            if (obj == null || typeof obj !== "object") return undefined;
            obj = obj[key];
        }
        return obj;
    };

    if (!isAuthenticated) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
                        <h2 className="mb-2 text-xl font-semibold">Unauthorized</h2>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Open the authenticated URL from <code className="rounded bg-muted px-1.5 py-0.5">forkscout web</code> to access settings.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-16">
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
                            <p className="text-sm text-muted-foreground">
                                Edit agent configuration — changes are hot-reloaded.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View toggle */}
                            <div className="flex rounded-lg border border-border">
                                <button
                                    onClick={() => setViewMode("visual")}
                                    className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-xs font-medium transition-colors ${viewMode === "visual" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Sliders className="h-3.5 w-3.5" /> Visual
                                </button>
                                <button
                                    onClick={() => {
                                        if (config) setJsonText(JSON.stringify(config, null, 4));
                                        setViewMode("json");
                                    }}
                                    className={`flex items-center gap-1.5 rounded-r-lg px-3 py-2 text-xs font-medium transition-colors ${viewMode === "json" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Code2 className="h-3.5 w-3.5" /> JSON
                                </button>
                            </div>
                            <button
                                onClick={load}
                                disabled={loading}
                                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-muted disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !dirty}
                                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                            >
                                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>

                    {/* Status toast */}
                    {status && (
                        <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${status.type === "success" ? "border-accent/30 bg-accent/5 text-accent" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                            {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {status.msg}
                        </div>
                    )}

                    {loading && !config ? (
                        <div className="flex items-center justify-center py-20 text-muted-foreground">
                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading config…
                        </div>
                    ) : viewMode === "json" ? (
                        /* JSON editor */
                        <div className="rounded-xl border border-border bg-card">
                            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                                <Code2 className="h-4 w-4 text-accent" />
                                <span className="text-sm font-semibold">forkscout.config.json</span>
                            </div>
                            <textarea
                                value={jsonText}
                                onChange={(e) => {
                                    setJsonText(e.target.value);
                                    setDirty(true);
                                    // Try to sync visual state
                                    try { setConfig(JSON.parse(e.target.value)); } catch { /* invalid JSON — wait for save */ }
                                }}
                                className="w-full bg-transparent p-5 font-mono text-sm leading-relaxed text-foreground outline-none"
                                rows={35}
                                spellCheck={false}
                            />
                        </div>
                    ) : config ? (
                        /* Visual editor */
                        <div className="space-y-6">
                            {/* Agent */}
                            <Section title="Agent Identity" icon={Settings2}>
                                <Field label="Name" value={get(["agent", "name"]) as string ?? ""} onChange={(v) => updateField(["agent", "name"], v)} />
                                <Field label="Description" value={get(["agent", "description"]) as string ?? ""} onChange={(v) => updateField(["agent", "description"], v)} multiline />
                                <Field label="GitHub URL" value={get(["agent", "github"]) as string ?? ""} onChange={(v) => updateField(["agent", "github"], v)} />
                                <Field label="Extra System Prompt" value={get(["agent", "systemPromptExtra"]) as string ?? ""} onChange={(v) => updateField(["agent", "systemPromptExtra"], v)} multiline />
                            </Section>

                            {/* LLM */}
                            <Section title="LLM Configuration" icon={Sliders}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <SelectField
                                        label="Provider"
                                        value={get(["llm", "provider"]) as string ?? "openrouter"}
                                        options={Object.keys((get(["llm", "providers"]) as Record<string, unknown>) ?? {})}
                                        onChange={(v) => updateField(["llm", "provider"], v)}
                                    />
                                    <SelectField
                                        label="Tier"
                                        value={get(["llm", "tier"]) as string ?? "balanced"}
                                        options={["fast", "balanced", "powerful"]}
                                        onChange={(v) => updateField(["llm", "tier"], v)}
                                    />
                                    <NumberField label="Max Tokens" value={get(["llm", "maxTokens"]) as number ?? 2000} onChange={(v) => updateField(["llm", "maxTokens"], v)} />
                                    <NumberField label="Max Steps" value={get(["llm", "maxSteps"]) as number ?? 100} onChange={(v) => updateField(["llm", "maxSteps"], v)} />
                                    <Field label="Reasoning Tag" value={get(["llm", "reasoningTag"]) as string ?? ""} onChange={(v) => updateField(["llm", "reasoningTag"], v)} />
                                    <NumberField label="Summarize Max Tokens" value={get(["llm", "llmSummarizeMaxTokens"]) as number ?? 1200} onChange={(v) => updateField(["llm", "llmSummarizeMaxTokens"], v)} />
                                </div>

                                {/* Provider model tiers */}
                                {(() => {
                                    const provider = get(["llm", "provider"]) as string;
                                    const tiers = get(["llm", "providers", provider]) as Record<string, string> | undefined;
                                    if (!tiers) return null;
                                    return (
                                        <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4">
                                            <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                                                Model IDs — {provider}
                                            </h4>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {Object.entries(tiers).map(([tier, model]) => (
                                                    <Field
                                                        key={tier}
                                                        label={tier}
                                                        value={model ?? ""}
                                                        onChange={(v) => updateField(["llm", "providers", provider, tier], v)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </Section>

                            {/* Telegram */}
                            <Section title="Telegram" icon={Settings2}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <NumberField label="Polling Timeout (s)" value={get(["telegram", "pollingTimeout"]) as number ?? 30} onChange={(v) => updateField(["telegram", "pollingTimeout"], v)} />
                                    <NumberField label="History Token Budget" value={get(["telegram", "historyTokenBudget"]) as number ?? 12000} onChange={(v) => updateField(["telegram", "historyTokenBudget"], v)} />
                                    <NumberField label="Rate Limit / Min" value={get(["telegram", "rateLimitPerMinute"]) as number ?? 20} onChange={(v) => updateField(["telegram", "rateLimitPerMinute"], v)} />
                                    <NumberField label="Max Input Length" value={get(["telegram", "maxInputLength"]) as number ?? 2000} onChange={(v) => updateField(["telegram", "maxInputLength"], v)} />
                                    <NumberField label="Max Tool Result Tokens" value={get(["telegram", "maxToolResultTokens"]) as number ?? 3000} onChange={(v) => updateField(["telegram", "maxToolResultTokens"], v)} />
                                </div>
                            </Section>

                            {/* Self channel */}
                            <Section title="Self Channel" icon={Settings2}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <NumberField label="HTTP Port" value={get(["self", "httpPort"]) as number ?? 3200} onChange={(v) => updateField(["self", "httpPort"], v)} />
                                    <NumberField label="History Token Budget" value={get(["self", "historyTokenBudget"]) as number ?? 12000} onChange={(v) => updateField(["self", "historyTokenBudget"], v)} />
                                </div>
                            </Section>

                            {/* Browser */}
                            <Section title="Browser" icon={Settings2}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <BoolField label="Headless" value={get(["browser", "headless"]) as boolean ?? false} onChange={(v) => updateField(["browser", "headless"], v)} />
                                    <NumberField label="Screenshot Quality" value={get(["browser", "screenshotQuality"]) as number ?? 50} onChange={(v) => updateField(["browser", "screenshotQuality"], v)} />
                                    <Field label="Chrome Path" value={get(["browser", "chromePath"]) as string ?? ""} onChange={(v) => updateField(["browser", "chromePath"], v)} />
                                    <Field label="Profile Dir" value={get(["browser", "profileDir"]) as string ?? ""} onChange={(v) => updateField(["browser", "profileDir"], v)} />
                                </div>
                            </Section>

                            {/* WhatsApp */}
                            <Section title="WhatsApp" icon={Settings2}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <NumberField label="History Token Budget" value={get(["whatsapp", "historyTokenBudget"]) as number ?? 12000} onChange={(v) => updateField(["whatsapp", "historyTokenBudget"], v)} />
                                    <NumberField label="Rate Limit / Min" value={get(["whatsapp", "rateLimitPerMinute"]) as number ?? 15} onChange={(v) => updateField(["whatsapp", "rateLimitPerMinute"], v)} />
                                    <NumberField label="Max Input Length" value={get(["whatsapp", "maxInputLength"]) as number ?? 2000} onChange={(v) => updateField(["whatsapp", "maxInputLength"], v)} />
                                </div>
                            </Section>
                        </div>
                    ) : null}
                </div>
            </main>
        </>
    );
}

/* ── Shared Components ─────────────────────────────────────────────────── */

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Icon className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
    const cls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20";
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
            {multiline ? (
                <textarea value={value} onChange={(e) => onChange(e.target.value)} className={cls} rows={3} />
            ) : (
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
            )}
        </label>
    );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            />
        </label>
    );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </label>
    );
}

function BoolField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-3">
            <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${value ? "bg-accent" : "bg-muted"}`}
            >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-sm text-muted-foreground">{label}</span>
        </label>
    );
}
