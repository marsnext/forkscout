// src/hooks/useAgent.ts — Talk to the local Forkscout agent over HTTP
import { useState, useCallback, useRef } from "react";
import type { Message, AgentSettings } from "../types";

const DEFAULT_SETTINGS: AgentSettings = {
    serverUrl: "http://localhost:3210",
    sessionKey: `ext-${Date.now()}`,
};

export function useAgent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<AgentSettings>(() => {
        try {
            const raw = localStorage.getItem("forkscout-settings");
            return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const abortRef = useRef<AbortController | null>(null);

    const saveSettings = useCallback((next: Partial<AgentSettings>) => {
        setSettings((prev) => {
            const merged = { ...prev, ...next };
            localStorage.setItem("forkscout-settings", JSON.stringify(merged));
            return merged;
        });
    }, []);

    const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
        const full: Message = { ...msg, id: crypto.randomUUID(), timestamp: Date.now() };
        setMessages((prev) => [...prev, full]);
        return full;
    }, []);

    const send = useCallback(
        async (userText: string, pageContext?: { url: string; title: string; selectedText?: string }) => {
            if (isLoading) return;

            addMessage({ role: "user", content: userText });
            setIsLoading(true);
            setError(null);

            // Build context prefix
            const contextNote = pageContext
                ? `[Page: ${pageContext.title} — ${pageContext.url}${pageContext.selectedText ? ` | Selection: "${pageContext.selectedText}"` : ""}]\n\n`
                : "";

            abortRef.current = new AbortController();

            try {
                const res = await fetch(`${settings.serverUrl}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: abortRef.current.signal,
                    body: JSON.stringify({
                        message: contextNote + userText,
                        sessionKey: settings.sessionKey,
                        channel: "extension",
                    }),
                });

                if (!res.ok) throw new Error(`Server error ${res.status}`);

                // Try streaming (text/event-stream) — fall back to JSON
                const contentType = res.headers.get("content-type") ?? "";

                if (contentType.includes("text/event-stream")) {
                    const reader = res.body!.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";
                    const assistantMsg = addMessage({ role: "assistant", content: "" });

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() ?? "";
                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const chunk = line.slice(6);
                                if (chunk === "[DONE]") break;
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
                                    )
                                );
                            }
                        }
                    }
                } else {
                    const json = await res.json();
                    addMessage({ role: "assistant", content: json.text ?? json.message ?? JSON.stringify(json) });
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                const msg = err instanceof Error ? err.message : "Unknown error";
                setError(msg);
                addMessage({ role: "system", content: `⚠️ ${msg}` });
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, settings, addMessage]
    );

    const stop = useCallback(() => {
        abortRef.current?.abort();
        setIsLoading(false);
    }, []);

    const clear = useCallback(() => {
        setMessages([]);
        setError(null);
        saveSettings({ sessionKey: `ext-${Date.now()}` });
    }, [saveSettings]);

    return { messages, isLoading, error, settings, saveSettings, send, stop, clear };
}
