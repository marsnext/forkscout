"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

export interface ChatMsg {
    role: "user" | "assistant";
    content: string;
    timestamp?: number;
}

interface Props { messages: ChatMsg[]; isStreaming: boolean; }

export function ChatMessages({ messages, isStreaming }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isStreaming]);

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                    <Bot className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold">Start a conversation</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Type a message below to talk to your ForkScout agent.
                    It has full tool access.
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 px-4 py-4">
            <div className="mx-auto max-w-2xl space-y-4">
                {messages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                                <Bot className="h-4 w-4 text-purple-500" />
                            </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-purple-500/90 text-white dark:bg-purple-600/80"
                                : "border border-border/40 bg-card/60 backdrop-blur-sm"
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                    </motion.div>
                ))}
                {isStreaming && (
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                            <Bot className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="rounded-2xl border border-border/40 bg-card/60 px-4 py-3 backdrop-blur-sm">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((d) => (
                                    <motion.div key={d} className="h-2 w-2 rounded-full bg-purple-400"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
