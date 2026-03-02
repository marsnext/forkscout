// web/src/lib/api.ts — API client for the ForkScout agent backend
// Token is passed explicitly from the AuthProvider context — never hardcoded.

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3200";

export { AGENT_URL };

export interface HealthResponse {
    ok: boolean;
    status: string;
    uptime?: number;
    version?: string;
    timestamp?: string;
}

export interface ChatResponse {
    ok: boolean;
    text?: string;
    steps?: number;
    error?: string;
}

/**
 * Check agent health (no auth required)
 */
export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    const res = await fetch(`${AGENT_URL}/health`, { cache: "no-store", signal });
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
}

/**
 * Send a message to the agent via HTTP trigger
 */
export async function sendChat(
    token: string,
    message: string,
    sessionKey: string,
): Promise<ChatResponse> {
    const res = await fetch(`${AGENT_URL}/trigger`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            prompt: message,
            session_key: sessionKey,
            role: "user",
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(body);
    }
    return res.json();
}

// ── Config API ───────────────────────────────────────────────────────────────

/**
 * Get the current forkscout.config.json
 */
export async function getConfig(token: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${AGENT_URL}/api/config`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
    return res.json();
}

/**
 * Save the full config JSON to disk
 */
export async function saveConfig(token: string, config: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${AGENT_URL}/api/config`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config, null, 4),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
}

// ── Secrets API ──────────────────────────────────────────────────────────────

/**
 * List all secret alias names (never returns values)
 */
export async function listSecrets(token: string): Promise<string[]> {
    const res = await fetch(`${AGENT_URL}/api/secrets`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to list secrets: ${res.status}`);
    const data = await res.json();
    return (data as { aliases: string[] }).aliases ?? [];
}

/**
 * Store a secret (alias + value). Value is encrypted server-side.
 */
export async function storeSecret(token: string, alias: string, value: string): Promise<void> {
    const res = await fetch(`${AGENT_URL}/api/secrets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alias, value }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
}

/**
 * Delete a secret by alias
 */
export async function removeSecret(token: string, alias: string): Promise<void> {
    const res = await fetch(`${AGENT_URL}/api/secrets?alias=${encodeURIComponent(alias)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
}
