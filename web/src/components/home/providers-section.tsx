"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Layers } from "lucide-react";
import { providers, badgeStyle } from "./providers-data";

const codeLines = [
    { text: "// Switch model — no code changes", cls: "text-emerald-500 dark:text-emerald-400" },
    { text: "{", cls: "text-muted-foreground" },
    { text: '  "llm"', cls: "text-purple-500 dark:text-purple-400", after: ": {", afterCls: "text-muted-foreground" },
    { text: '    "provider"', cls: "text-cyan-500 dark:text-cyan-400", after: ': "openrouter",', afterCls: "text-amber-500 dark:text-amber-400" },
    { text: '    "tier"', cls: "text-cyan-500 dark:text-cyan-400", after: ': "balanced"', afterCls: "text-amber-500 dark:text-amber-400" },
    { text: "  }", cls: "text-muted-foreground" },
    { text: "}", cls: "text-muted-foreground" },
];

const fadeBlur: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
    show: {
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export function ProvidersSection() {
    return (
        <section id="providers" className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
            {/* Background accent */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <motion.div
                    className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Heading */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="mb-16 text-center"
            >
                <motion.span
                    className="mb-4 inline-block rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-medium tracking-wider text-amber-600 uppercase dark:border-amber-400/20 dark:text-amber-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <Layers className="mr-1.5 inline h-3 w-3" />
                    Provider Agnostic
                </motion.span>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    <span className="bg-linear-to-r from-amber-500 via-pink-500 to-purple-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-pink-400 dark:to-purple-400">
                        9 LLM providers.
                    </span>{" "}
                    One JSON field.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
                    Swap providers and model tiers without touching code.
                </p>
            </motion.div>

            {/* Provider badges */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="mb-14 flex flex-wrap justify-center gap-3"
            >
                {providers.map((p, i) => (
                    <motion.span
                        key={p.slug}
                        initial={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
                        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        whileHover={{ y: -2, scale: 1.06 }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${badgeStyle[p.color]}`}
                    >
                        <Image
                            src={p.logo}
                            alt={`${p.name} logo`}
                            width={18}
                            height={18}
                            className="h-4.5 w-4.5 rounded-sm object-contain"
                            unoptimized
                        />
                        {p.name}
                    </motion.span>
                ))}
            </motion.div>

            {/* Code block */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="mx-auto max-w-xl"
            >
                <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-400/70" />
                            <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
                            <div className="h-3 w-3 rounded-full bg-green-400/70" />
                        </div>
                        <span className="ml-2 text-xs text-muted-foreground/60">forkscout.config.json</span>
                    </div>
                    <div className="flex">
                        <div className="flex flex-col border-r border-border/30 px-3 py-5 text-right font-mono text-xs leading-relaxed text-muted-foreground/30">
                            {codeLines.map((_, i) => <span key={i}>{i + 1}</span>)}
                        </div>
                        <pre className="flex-1 overflow-x-auto p-5 font-mono text-sm leading-relaxed scrollbar-none">
                            {codeLines.map((line, i) => (
                                <div key={i}>
                                    <span className={line.cls}>{line.text}</span>
                                    {line.after && <span className={line.afterCls}>{line.after}</span>}
                                </div>
                            ))}
                        </pre>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
