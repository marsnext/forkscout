"use client";

import { motion, type Variants } from "framer-motion";
import { Wrench } from "lucide-react";
import { techStack } from "./tech-data";

const fadeBlur: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
    show: {
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export function TechStackSection() {
    return (
        <section className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
            {/* Background glow */}
            <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Heading */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="mb-16 text-center"
            >
                <motion.span
                    className="mb-4 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium tracking-wider text-cyan-600 uppercase dark:border-cyan-400/20 dark:text-cyan-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <Wrench className="mr-1.5 inline h-3 w-3" />
                    Tech Stack
                </motion.span>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    <span className="bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400">
                        Built with the best.
                    </span>{" "}
                    Here&#39;s why.
                </h2>
            </motion.div>

            {/* Cards grid */}
            <motion.div
                variants={fadeBlur} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {techStack.map((tech, i) => (
                    <motion.div
                        key={tech.name}
                        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="group relative rounded-2xl border border-border/30 bg-card/40 p-5 backdrop-blur-sm transition-colors hover:border-border/60"
                    >
                        {/* Icon */}
                        <div className={`mb-3 inline-flex rounded-xl ${tech.bg} p-2.5`}>
                            <tech.icon className={`h-5 w-5 ${tech.color}`} />
                        </div>
                        {/* Name */}
                        <h3 className="mb-1.5 text-base font-semibold">{tech.name}</h3>
                        {/* Why */}
                        <p className="text-sm leading-relaxed text-muted-foreground">{tech.why}</p>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
