"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@web/components/navbar";
import { useAuth } from "@web/lib/auth-context";
import { listSecrets, storeSecret, removeSecret } from "@web/lib/api";
import {
    KeyRound,
    Plus,
    Trash2,
    RefreshCw,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Eye,
    EyeOff,
    Copy,
    Search,
} from "lucide-react";

export default function SecretsPage() {
    const { token, isAuthenticated } = useAuth();
    const [aliases, setAliases] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Add form
    const [newAlias, setNewAlias] = useState("");
    const [newValue, setNewValue] = useState("");
    const [showValue, setShowValue] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filter, setFilter] = useState("");

    // Confirm delete
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await listSecrets(token);
            setAliases(data.sort());
        } catch (err: any) {
            setStatus({ type: "error", msg: err.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!status) return;
        const t = setTimeout(() => setStatus(null), 4000);
        return () => clearTimeout(t);
    }, [status]);

    const handleAdd = async () => {
        if (!token || !newAlias.trim() || !newValue.trim()) return;
        setAdding(true);
        try {
            await storeSecret(token, newAlias.trim(), newValue.trim());
            setStatus({ type: "success", msg: `Secret "${newAlias.trim()}" stored.` });
            setNewAlias("");
            setNewValue("");
            setShowValue(false);
            setShowAddForm(false);
            await load();
        } catch (err: any) {
            setStatus({ type: "error", msg: err.message });
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (alias: string) => {
        if (!token) return;
        try {
            await removeSecret(token, alias);
            setStatus({ type: "success", msg: `Secret "${alias}" deleted.` });
            setDeleteTarget(null);
            await load();
        } catch (err: any) {
            setStatus({ type: "error", msg: err.message });
        }
    };

    const filtered = aliases.filter((a) => a.toLowerCase().includes(filter.toLowerCase()));

    if (!isAuthenticated) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
                        <h2 className="mb-2 text-xl font-semibold">Unauthorized</h2>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Open the authenticated URL from <code className="rounded bg-muted px-1.5 py-0.5">forkscout web</code> to manage secrets.
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
                <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold sm:text-3xl">Secrets</h1>
                            <p className="text-sm text-muted-foreground">
                                Encrypted vault — values are never exposed in the dashboard.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={load}
                                disabled={loading}
                                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-muted disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
                            </button>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Secret
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

                    {/* Add form */}
                    {showAddForm && (
                        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
                            <h3 className="mb-4 text-sm font-semibold">Store New Secret</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Alias</span>
                                    <input
                                        type="text"
                                        value={newAlias}
                                        onChange={(e) => setNewAlias(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                                        placeholder="MY_API_KEY"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Value</span>
                                    <div className="relative">
                                        <input
                                            type={showValue ? "text" : "password"}
                                            value={newValue}
                                            onChange={(e) => setNewValue(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 font-mono text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowValue(!showValue)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </label>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={handleAdd}
                                    disabled={adding || !newAlias.trim() || !newValue.trim()}
                                    className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                                >
                                    {adding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                    {adding ? "Storing…" : "Store"}
                                </button>
                                <button
                                    onClick={() => { setShowAddForm(false); setNewAlias(""); setNewValue(""); setShowValue(false); }}
                                    className="rounded-lg border border-border px-4 py-2 text-xs transition-colors hover:bg-muted"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Alias format: <code className="rounded bg-muted px-1 py-0.5">UPPER_SNAKE_CASE</code>. Values are AES-256-GCM encrypted at rest.
                            </p>
                        </div>
                    )}

                    {/* Search */}
                    {aliases.length > 5 && (
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Filter secrets…"
                                className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                            />
                        </div>
                    )}

                    {/* Secret list */}
                    <div className="rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                            <KeyRound className="h-4 w-4 text-accent" />
                            <span className="text-sm font-semibold">
                                Vault ({aliases.length} secret{aliases.length !== 1 ? "s" : ""})
                            </span>
                        </div>

                        {loading && !aliases.length ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                {aliases.length === 0 ? "No secrets stored yet." : "No secrets match filter."}
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filtered.map((alias) => (
                                    <div key={alias} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-mono text-sm">{alias}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(alias); setStatus({ type: "success", msg: `Alias "${alias}" copied.` }); }}
                                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                title="Copy alias"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            {deleteTarget === alias ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(alias)}
                                                        className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(null)}
                                                        className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteTarget(alias)}
                                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                    title="Delete secret"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Secret values are encrypted with AES-256-GCM and never leave the server.
                    </p>
                </div>
            </main>
        </>
    );
}
