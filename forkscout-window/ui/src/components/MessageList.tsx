// src/components/MessageList.tsx
import { useEffect, useRef } from "react";
import type { Message } from "../types";
import styles from "./MessageList.module.css";

interface Props {
    messages: Message[];
    isLoading: boolean;
}

export function MessageList({ messages, isLoading }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    if (messages.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>⚡</div>
                <p>Ask me anything about this page,<br />or give me a task to run.</p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {messages.map((msg) => (
                <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                    <div className={styles.bubble}>
                        <pre className={styles.content}>{msg.content}</pre>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                    <div className={styles.bubble}>
                        <span className={styles.typing}>
                            <span /><span /><span />
                        </span>
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
