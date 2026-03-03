"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props { onSend: (text: string) => void; disabled: boolean; }

export function ChatInput({ onSend, disabled }: Props) {
    const [text, setText] = useState("");
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { if (!disabled) ref.current?.focus(); }, [disabled]);

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText("");
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    };

    return (
        <div className="border-t border-border/40 bg-background/80 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-2xl items-end gap-2">
                <Textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKey} disabled={disabled}
                    placeholder="Type a message..."
                    className="min-h-[44px] max-h-32 resize-none border-border/40 bg-card/50 backdrop-blur-sm"
                    rows={1} />
                <Button onClick={submit} disabled={disabled || !text.trim()} size="icon"
                    className="h-11 w-11 shrink-0 bg-linear-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
