"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Radio } from "lucide-react";
import { channels, typeLabels, type ChannelItem } from "./channels-data";

const types = ["all", "core", "gateway", "webhook", "polling"] as const;

const fadeBlur: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
    show: {
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export function ChannelsSection() {
    const [filter, setFilter] = useState<string>("all");
    const filtered = filter === "all" ? channels : channels.filter(c => c.type === filter);

    return (
        <section id="channels" className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
            {/* BG glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <motion.div
                    className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Heading */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="mb-12 text-center"
            >
                <motion.span
                    className="mb-4 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium tracking-wider text-cyan-600 uppercase dark:border-cyan-400/20 dark:text-cyan-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <Radio className="mr-1.5 inline h-3 w-3" />
                    Multi-Channel
                </motion.span>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    <span className="bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400">
                        20 channels.
                    </span>{" "}
                    One agent brain.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                    Same adapter pattern everywhere — raw JSON in, agent reply out.
                    Set env vars and it auto-starts.
                </p>
            </motion.div>

            {/* Filter tabs */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="mb-8 flex flex-wrap justify-center gap-2"
            >
                {types.map(t => {
                    const active = filter === t;
                    const meta = t === "all" ? null : typeLabels[t];
                    return (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-all duration-200 ${active
                                ? "border-purple-500/40 bg-purple-500/15 text-purple-600 shadow-sm dark:text-purple-400"
                                : "border-border/40 bg-card/40 text-muted-foreground hover:border-border/60 hover:bg-card/60"
                                }`}
                        >
                            {t === "all" ? `All (${channels.length})` : `${meta?.label} (${channels.filter(c => c.type === t).length})`}
                        </button>
                    );
                })}
            </motion.div>

            {/* Channel grid */}
            <motion.div
                layout
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
                {filtered.map((ch, i) => (
                    <ChannelCard key={ch.name} channel={ch} index={i} />
                ))}
            </motion.div>

            {/* Bottom note */}
            <motion.p
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true }}
                className="mt-10 text-center text-sm text-muted-foreground"
            >
                Each channel is ~60-80 lines of code. All share the same adapter —
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">createChannelHandler()</code>
            </motion.p>
        </section>
    );
}

function ChannelCard({ channel: ch, index }: { channel: ChannelItem; index: number }) {
    const meta = typeLabels[ch.type];
    return (
        <motion.div
            layout
            variants={fadeBlur}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: index * 0.03 }}
        >
            <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative flex h-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:shadow-xl"
            >
                {/* Corner glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${ch.bg} blur-2xl`} />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ch.bg} ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110`}>
                        <ch.icon className={`h-4 w-4 ${ch.color}`} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold tracking-tight leading-tight">{ch.name}</h3>
                        <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${meta.color}`}>
                            {meta.label}
                        </span>
                    </div>
                </div>
                <p className="relative z-10 text-xs leading-relaxed text-muted-foreground">{ch.desc}</p>
            </motion.div>
        </motion.div>
    );
}
