// src/App.tsx — Forkscout Window side panel root
import { useState, useEffect, useCallback } from "react";
import { MessageList } from "./components/MessageList";
import { InputBar } from "./components/InputBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { useAgent } from "./hooks/useAgent";
import type { PageContext } from "./types";
import styles from "./App.module.css";

export function App() {
    const { messages, isLoading, error, settings, saveSettings, send, stop, clear } = useAgent();
    const [pageCtx, setPageCtx] = useState<PageContext | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Listen for page context from content script via background worker
    useEffect(() => {
        const handler = (msg: { type: string; url?: string; title?: string; selectedText?: string }) => {
            if (msg.type === "PAGE_CONTEXT") {
                setPageCtx({ url: msg.url ?? "", title: msg.title ?? "", selectedText: msg.selectedText });
            }
            if (msg.type === "INJECT_PROMPT" && msg.selectedText) {
                void handleSend(msg.selectedText);
            }
        };
        chrome.runtime.onMessage.addListener(handler);
        return () => chrome.runtime.onMessage.removeListener(handler);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Ask content script for current page context on load
    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (!tab?.id) return;
            chrome.tabs.sendMessage(tab.id, { type: "GET_CONTEXT" }, (res) => {
                if (chrome.runtime.lastError) return;
                if (res?.url) setPageCtx(res as PageContext);
            });
        });
    }, []);

    const handleSend = useCallback(
        (text: string) => send(text, pageCtx ?? undefined),
        [send, pageCtx]
    );

    return (
        <div className={styles.root}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>⚡</span>
                    <span className={styles.logoText}>Forkscout</span>
                </div>
                {pageCtx && (
                    <div className={styles.pageChip} title={pageCtx.url}>
                        {pageCtx.title.slice(0, 28)}{pageCtx.title.length > 28 ? "…" : ""}
                    </div>
                )}
                <div className={styles.actions}>
                    <button className={styles.iconBtn} onClick={clear} title="New chat" aria-label="New chat">
                        ✦
                    </button>
                    <button className={styles.iconBtn} onClick={() => setShowSettings(true)} title="Settings" aria-label="Settings">
                        ⚙
                    </button>
                </div>
            </header>

            {/* Error banner */}
            {error && <div className={styles.errorBanner}>⚠ {error}</div>}

            {/* Messages */}
            <MessageList messages={messages} isLoading={isLoading} />

            {/* Input */}
            <InputBar onSend={handleSend} onStop={stop} isLoading={isLoading} />

            {/* Settings sheet */}
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    onSave={saveSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
