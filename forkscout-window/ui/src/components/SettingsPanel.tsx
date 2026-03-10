// src/components/SettingsPanel.tsx
import { useState } from "react";
import type { AgentSettings } from "../types";
import styles from "./SettingsPanel.module.css";

interface Props {
    settings: AgentSettings;
    onSave: (s: Partial<AgentSettings>) => void;
    onClose: () => void;
}

export function SettingsPanel({ settings, onSave, onClose }: Props) {
    const [url, setUrl] = useState(settings.serverUrl);
    const [token, setToken] = useState(settings.token ?? "");

    const save = () => {
        onSave({ serverUrl: url.trim().replace(/\/$/, ""), token: token.trim() });
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.panel}>
                <h3 className={styles.title}>Settings</h3>

                <label className={styles.label}>
                    Agent server URL
                    <input
                        className={styles.input}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="http://localhost:3200"
                    />
                    <span className={styles.hint}>The address of your running forkscout agent</span>
                </label>

                <label className={styles.label}>
                    API token
                    <input
                        className={styles.input}
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste token from .agents/.ext-token"
                    />
                    <span className={styles.hint}>Run: <code>cat .agents/.ext-token</code> in your agent folder</span>
                </label>

                <label className={styles.label}>
                    Session key
                    <input className={styles.input} value={settings.sessionKey} readOnly />
                    <span className={styles.hint}>Auto-generated — resets on "New chat"</span>
                </label>

                <div className={styles.actions}>
                    <button className={styles.cancel} onClick={onClose}>Cancel</button>
                    <button className={styles.save} onClick={save}>Save</button>
                </div>
            </div>
        </div>
    );
}
