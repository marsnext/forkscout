// src/setup/channel-info.ts — Channel metadata for setup wizard.
// Each channel lists its required secrets (vault keys) so we can detect setup status.

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getSecret } from "@/secrets/vault.ts";

export interface ChannelInfo {
    name: string;
    displayName: string;
    description: string;
    /** Vault secret keys this channel requires. Empty = no secrets needed. */
    requiredSecrets: string[];
    /** URL with setup instructions */
    setupUrl?: string;
    /** True = always available, no setup needed (terminal, self, webchat) */
    builtIn?: boolean;
    /** Custom readiness check (e.g. WhatsApp session file) */
    customCheck?: () => boolean;
}

export const CHANNELS: ChannelInfo[] = [
    // ── Built-in (no setup) ──────────────────────────────────────────────
    { name: "terminal", displayName: "Terminal", description: "Interactive CLI — built-in, always available", requiredSecrets: [], builtIn: true },
    { name: "self", displayName: "Self", description: "Cron jobs & HTTP trigger — built-in", requiredSecrets: [], builtIn: true },
    { name: "webchat", displayName: "Web Chat", description: "WebSocket chat — runs on self-channel port", requiredSecrets: [], builtIn: true },

    // ── Messaging platforms ──────────────────────────────────────────────
    { name: "telegram", displayName: "Telegram", description: "Telegram bot via long-polling", requiredSecrets: ["TELEGRAM_BOT_TOKEN"], setupUrl: "https://t.me/BotFather" },
    { name: "whatsapp", displayName: "WhatsApp", description: "WhatsApp via Baileys (QR code login)", requiredSecrets: [], setupUrl: "https://github.com/WhiskeySockets/Baileys", customCheck: () => existsSync(resolve(".agents", "whatsapp-sessions", "creds.json")) },
    { name: "discord", displayName: "Discord", description: "Discord bot via gateway", requiredSecrets: ["DISCORD_BOT_TOKEN"], setupUrl: "https://discord.com/developers/applications" },
    { name: "slack", displayName: "Slack", description: "Slack bot via Socket Mode", requiredSecrets: ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"], setupUrl: "https://api.slack.com/apps" },
    { name: "messenger", displayName: "Messenger", description: "Facebook Messenger bot", requiredSecrets: ["MESSENGER_PAGE_ACCESS_TOKEN", "MESSENGER_VERIFY_TOKEN"], setupUrl: "https://developers.facebook.com/apps" },
    { name: "instagram", displayName: "Instagram", description: "Instagram DMs via Graph API", requiredSecrets: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_VERIFY_TOKEN"], setupUrl: "https://developers.facebook.com/apps" },

    // ── Enterprise / team platforms ──────────────────────────────────────
    { name: "teams", displayName: "MS Teams", description: "Microsoft Teams via Bot Framework", requiredSecrets: ["TEAMS_APP_ID", "TEAMS_APP_PASSWORD"] },
    { name: "google_chat", displayName: "Google Chat", description: "Google Workspace Chat bot", requiredSecrets: ["GOOGLE_CHAT_SERVICE_ACCOUNT"] },
    { name: "matrix", displayName: "Matrix", description: "Matrix homeserver bot", requiredSecrets: ["MATRIX_HOMESERVER_URL", "MATRIX_ACCESS_TOKEN"] },

    // ── Communication ────────────────────────────────────────────────────
    { name: "email", displayName: "Email", description: "IMAP inbox polling + SMTP replies", requiredSecrets: ["EMAIL_IMAP_HOST", "EMAIL_IMAP_USER", "EMAIL_IMAP_PASS"] },
    { name: "sms", displayName: "SMS", description: "SMS via Twilio Messaging", requiredSecrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"] },
    { name: "voice", displayName: "Voice", description: "Voice calls via Twilio Voice + TTS/STT", requiredSecrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"] },

    // ── Social media ─────────────────────────────────────────────────────
    { name: "twitter", displayName: "Twitter/X", description: "X DMs via API v2", requiredSecrets: ["TWITTER_BEARER_TOKEN", "TWITTER_API_KEY", "TWITTER_API_SECRET"] },
    { name: "reddit", displayName: "Reddit", description: "Reddit inbox monitoring", requiredSecrets: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD"] },
    { name: "youtube", displayName: "YouTube", description: "YouTube Live Chat bot", requiredSecrets: ["YOUTUBE_API_KEY", "YOUTUBE_LIVE_CHAT_ID"] },

    // ── Asian messaging ──────────────────────────────────────────────────
    { name: "line", displayName: "LINE", description: "LINE Messaging API bot", requiredSecrets: ["LINE_CHANNEL_ACCESS_TOKEN", "LINE_CHANNEL_SECRET"] },
    { name: "viber", displayName: "Viber", description: "Viber bot via webhook", requiredSecrets: ["VIBER_AUTH_TOKEN", "VIBER_WEBHOOK_URL"] },
];

/** Check if a channel is ready to use. */
export function isChannelConfigured(ch: ChannelInfo): boolean {
    if (ch.builtIn) return true;
    if (ch.customCheck) return ch.customCheck();
    if (ch.requiredSecrets.length === 0) return true;
    return ch.requiredSecrets.every((key) => !!getSecret(key));
}

/** Count how many required secrets are set for a channel. */
export function channelSecretProgress(ch: ChannelInfo): { set: number; total: number } {
    const total = ch.requiredSecrets.length;
    const set = ch.requiredSecrets.filter((key) => !!getSecret(key)).length;
    return { set, total };
}
