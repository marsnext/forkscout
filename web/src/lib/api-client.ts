// API client for ForkScout backend — wraps fetch with auth token from localStorage.

const STORAGE_KEY = "forkscout_token";
const API_URL_KEY = "forkscout_api_url";
const DEFAULT_API = "http://127.0.0.1:3200";

export function getApiUrl(): string {
    if (typeof window === "undefined") return DEFAULT_API;
    return localStorage.getItem(API_URL_KEY) || DEFAULT_API;
}

export function setApiUrl(url: string) {
    localStorage.setItem(API_URL_KEY, url.replace(/\/+$/, ""));
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(STORAGE_KEY);
}

/** Fetch with auth token auto-injected. Throws on non-ok responses. */
export async function apiFetch<T = unknown>(
    path: string,
    opts: RequestInit = {},
): Promise<T> {
    const token = getToken();
    const base = getApiUrl();
    const res = await fetch(`${base}${path}`, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers ?? {}),
        },
    });
    if (res.status === 401) {
        clearToken();
        if (typeof window !== "undefined") {
            window.location.href = "/web/login";
        }
        throw new Error("Unauthorized");
    }
    const data = await res.json();
    if (!res.ok) throw new Error((data as Record<string, string>).error || res.statusText);
    return data as T;
}

/** Check if current token is valid by hitting an auth-required endpoint. */
export async function validateToken(): Promise<boolean> {
    try {
        const token = getToken();
        if (!token) return false;
        const base = getApiUrl();
        const res = await fetch(`${base}/api/config`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
    } catch {
        return false;
    }
}

/** Fetch health (no auth required). */
export async function fetchHealth() {
    const base = getApiUrl();
    const res = await fetch(`${base}/health`);
    return res.json() as Promise<{
        ok: boolean;
        status: string;
        uptime: number;
        version: string;
        timestamp: string;
    }>;
}
