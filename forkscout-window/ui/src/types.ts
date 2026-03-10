// src/types.ts — Shared types for Forkscout Window extension

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}

export interface PageContext {
    url: string;
    title: string;
    selectedText?: string;
}

export interface AgentSettings {
    serverUrl: string;   // e.g. http://localhost:3200
    sessionKey: string;
    token: string;       // Bearer token from .agents/.ext-token
}
