"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const lines: { text: string; cls: string; delay: number }[] = [
    { text: "$ forkscout start", cls: "text-emerald-400", delay: 0 },
    { text: "▸ Loading 52 tools from src/tools/", cls: "text-muted-foreground", delay: 600 },
    { text: "▸ Connected to 4 MCP servers", cls: "text-muted-foreground", delay: 1000 },
    { text: "▸ Telegram channel ready", cls: "text-cyan-400", delay: 1400 },
    { text: "▸ WhatsApp channel ready", cls: "text-cyan-400", delay: 1600 },
    { text: "▸ Terminal channel ready", cls: "text-cyan-400", delay: 1800 },
    { text: "", cls: "", delay: 2200 },
    { text: "You: Find all TODO comments in the codebase", cls: "text-purple-400", delay: 2400 },
    { text: "", cls: "", delay: 2800 },
    { text: '⚡ Agent → run_shell("grep -rn TODO src/")', cls: "text-amber-400", delay: 3000 },
    { text: "  src/agent/index.ts:42: // TODO: add retry", cls: "text-muted-foreground/70", delay: 3400 },
    { text: "  src/tools/http.ts:18: // TODO: timeout", cls: "text-muted-foreground/70", delay: 3600 },
    { text: "  src/channels/telegram:7: // TODO: media", cls: "text-muted-foreground/70", delay: 3800 },
    { text: "", cls: "", delay: 4000 },
    { text: "⚡ Agent → write_file(progress.md)", cls: "text-amber-400", delay: 4200 },
    { text: "✓ Found 3 TODOs. Saved report to progress.md", cls: "text-emerald-400", delay: 4800 },
    { text: '⚡ Agent → save_knowledge("3 TODOs found")', cls: "text-amber-400", delay: 5200 },
    { text: "✓ Memorized for next session.", cls: "text-emerald-400", delay: 5600 },
];

export function TerminalDemo() {
    const [visible, setVisible] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!started) return;
        if (visible >= lines.length) return;
        const timer = setTimeout(
            () => setVisible((v) => v + 1),
            (lines[visible]?.delay ?? 0) - (lines[visible - 1]?.delay ?? 0) || 400
        );
        return () => clearTimeout(timer);
    }, [visible, started]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, [visible]);

    return (
        <section className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
            >
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-black/80 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                    {/* Title bar */}
                    <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-3">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-500/70" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                            <div className="h-3 w-3 rounded-full bg-green-500/70" />
                        </div>
                        <span className="ml-2 text-[11px] font-medium text-white/30">forkscout — zsh</span>
                        <div className="ml-auto flex items-center gap-1">
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            <span className="text-[10px] text-emerald-400/70">live</span>
                        </div>
                    </div>

                    {/* Terminal body */}
                    <div ref={ref} className="h-[340px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed scrollbar-none sm:p-5">
                        {lines.slice(0, visible).map((line, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={line.cls || "h-4"}
                            >
                                {line.text}
                            </motion.div>
                        ))}
                        {visible < lines.length && started && (
                            <span className="inline-block h-4 w-2 animate-pulse bg-purple-400/80" />
                        )}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
