// src/channels/telegram/auth-helpers.ts — Auth helpers for telegram channel
// Updated after extraction from original index.ts

import type { AppConfig } from "@/config.ts";

// ─── Module-level state (runtime auth) ────────────────────────────────────────

/** Per-user rate limit tracking: userId → { count, windowStart } */
export const rateLimiter = new Map<number, { count: number; windowStart: number }>();

/** Runtime allowlist — seeded from config.telegram.allowedUserIds at startup. */
export let runtimeAllowedUsers = new Set<number>();

/** Runtime owner set — seeded from vault (TELEGRAM_OWNER_IDS) at startup. */
export let runtimeOwnerUsers = new Set<number>();

/** Runtime admin set — seeded from approved admin requests at startup. */
export let runtimeAdminUsers = new Set<number>();

/** True when both vault owner IDs and allowedUserIds are empty (dev mode = all owners). */
export let devMode = false;

// ─── Helper functions ────────────────────────────────────────────────────────

/** Parse owner user IDs from vault-stored env var. */
export function getVaultOwnerIds(): number[] {
    const raw = process.env.TELEGRAM_OWNER_IDS;
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((n: any) => typeof n === "number") : [];
    } catch {
        return [];
    }
}

/** Returns 'owner' | 'admin' | 'user' | 'denied'. devMode = everyone is owner. */
export function getRole(userId: number, _config: AppConfig): "owner" | "admin" | "user" | "denied" {
    if (devMode) return 'owner';
    if (runtimeOwnerUsers.has(userId)) return "owner";
    if (runtimeAdminUsers.has(userId)) return "admin";
    if (runtimeAllowedUsers.has(userId)) return "user";
    return 'denied';
}

/** Returns true if user is within their rate limit window. Owners are never rate-limited. */
export function checkRateLimit(userId: number, limitPerMin: number): boolean {
    if (limitPerMin <= 0) return true;
    const now = Date.now();
    const entry = rateLimiter.get(userId) ?? { count: 0, windowStart: now };
    if (now - entry.windowStart > 60_000) {
        rateLimiter.set(userId, { count: 1, windowStart: now });
        return true;
    }
    if (entry.count >= limitPerMin) return false;
    entry.count++;
    rateLimiter.set(userId, entry);
    return true;
}

/** Seed all runtime auth state at bot startup. Call once from poll-loop start(). */
export function seedAuthState(
    ownerIds: number[],
    allowedIds: number[],
    adminIds: number[],
    isDev: boolean
): void {
    devMode = isDev;
    runtimeOwnerUsers = new Set(ownerIds);
    runtimeAllowedUsers = new Set(allowedIds);
    runtimeAdminUsers = new Set(adminIds);
}

/** Add a user to the runtime allowed set (immediately effective, no restart needed). */
export function addRuntimeAllowed(userId: number): void {
    runtimeAllowedUsers.add(userId);
}

/** Add a user to the runtime admin set. */
export function addRuntimeAdmin(userId: number): void {
    runtimeAdminUsers.add(userId);
}
