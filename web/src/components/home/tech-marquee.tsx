"use client";

import { motion } from "framer-motion";
import { techStack } from "./tech-data";

const items = [...techStack, ...techStack];

export function TechMarquee() {
    return (
        <section id="tech-stack" className="relative mx-auto max-w-[900px] overflow-hidden py-10">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent sm:w-40" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent sm:w-40" />

            {/* Heading */}
            <h2 className="mb-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
                Built{" "}
                <span className="bg-linear-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">With</span>
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">The modern stack powering ForkScout</p>

            {/* Marquee with interactive cards */}
            <motion.div
                className="flex w-max gap-5"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            >
                {items.map((item, i) => (
                    <motion.div
                        key={`${item.name}-${i}`}
                        whileHover={{ y: -6, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="group flex h-28 w-64 shrink-0 cursor-default flex-col gap-2 rounded-2xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/60 hover:shadow-xl"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`inline-flex rounded-lg ${item.bg} p-1.5 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110`}>
                                <item.icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <span className="text-sm font-semibold">{item.name}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">{item.why}</p>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
