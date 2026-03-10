// src/components/InputBar.tsx
import { useState, useRef, useCallback } from "react";
import styles from "./InputBar.module.css";

interface Props {
    onSend: (text: string) => void;
    onStop: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

export function InputBar({ onSend, onStop, isLoading, disabled }: Props) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submit = useCallback(() => {
        const text = value.trim();
        if (!text || isLoading) return;
        onSend(text);
        setValue("");
        // Reset height
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    }, [value, isLoading, onSend]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        // Auto-grow
        const el = e.target;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    };

    return (
        <div className={styles.bar}>
            <textarea
                ref={textareaRef}
                className={styles.input}
                placeholder="Message Forkscout… (Enter to send, Shift+Enter for newline)"
                value={value}
                onChange={onInput}
                onKeyDown={onKeyDown}
                rows={1}
                disabled={disabled}
            />
            <button
                className={`${styles.btn} ${isLoading ? styles.stop : styles.send}`}
                onClick={isLoading ? onStop : submit}
                disabled={!isLoading && !value.trim()}
                aria-label={isLoading ? "Stop" : "Send"}
            >
                {isLoading ? "■" : "↑"}
            </button>
        </div>
    );
}
