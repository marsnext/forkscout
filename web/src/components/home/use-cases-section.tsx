"use client";

import { motion, type Variants } from "framer-motion";
import {
    Server, Code2, BookOpen, ShieldCheck, Workflow, BotMessageSquare,
} from "lucide-react";

const useCases = [
    {
        icon: Server,
        title: "DevOps Automation",
        desc: "Automate deployments, monitor servers, and handle incident response — 24/7 without human intervention.",
        color: "purple",
        tag: "Infrastructure",
    },
    {
        icon: Code2,
        title: "Code Review & Refactor",
        desc: "Analyze pull requests, suggest improvements, refactor legacy code, and enforce coding standards autonomously.",
        color: "cyan",
        tag: "Engineering",
    },
    {
        icon: BookOpen,
        title: "Research & Analysis",
        desc: "Search the web, read documents, synthesize findings, and deliver structured reports on any topic.",
        color: "pink",
        tag: "Knowledge",
    },
    {
        icon: ShieldCheck,
        title: "Security Auditing",
        desc: "Scan codebases for vulnerabilities, review dependencies, and generate security compliance reports.",
        color: "emerald",
        tag: "Security",
    },
    {
        icon: Workflow,
        title: "CI/CD Pipelines",
        desc: "Orchestrate build, test, and deploy workflows. Auto-fix failing tests and notify across channels.",
        color: "amber",
        tag: "Automation",
    },
    {
        icon: BotMessageSquare,
        title: "Multi-Channel Support",
        desc: "Answer questions on Telegram, WhatsApp, and web simultaneously with shared context and memory.",
        color: "violet",
        tag: "Communication",
    },
];

type ColorDef = { icon: string; bg: string; border: string; tag: string };

const colors: Record<string, ColorDef> = {
    purple: { icon: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", tag: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    cyan: { icon: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", tag: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
    pink: { icon: "text-pink-500 dark:text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", tag: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
    emerald: { icon: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", tag: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    amber: { icon: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", tag: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    violet: { icon: "text-violet-500 dark:text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", tag: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

const fadeBlur: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: {
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export function UseCasesSection() {
    return (
        <section id="use-cases" className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="mb-16 text-center"
            >
                <motion.span
                    className="mb-4 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium tracking-wider text-cyan-600 uppercase dark:border-cyan-400/20 dark:text-cyan-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    Use Cases
                </motion.span>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    What can you{" "}
                    <span className="bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400">
                        build with it?
                    </span>
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                    From DevOps to research — one agent, infinite workflows.
                </p>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {useCases.map((uc, i) => {
                    const c = colors[uc.color];
                    return (
                        <motion.div
                            key={uc.title}
                            variants={fadeBlur}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <motion.div
                                whileHover={{ y: -6, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`group relative h-full overflow-hidden rounded-2xl border ${c.border} bg-card/50 p-6 backdrop-blur-sm transition-colors hover:border-opacity-50`}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110`}>
                                        <uc.icon className={`h-5 w-5 ${c.icon}`} />
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${c.tag}`}>
                                        {uc.tag}
                                    </span>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold tracking-tight">{uc.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{uc.desc}</p>

                                {/* Hover glow */}
                                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                                    <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${c.bg} blur-2xl`} />
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
