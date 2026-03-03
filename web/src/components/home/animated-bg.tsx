"use client";

import { motion } from "framer-motion";

const orbs = [
    { className: "left-[10%] top-[10%] h-[500px] w-[500px] bg-purple-500/15 dark:bg-purple-500/8", delay: 0, duration: 20 },
    { className: "right-[5%] top-[15%] h-[400px] w-[400px] bg-cyan-500/15 dark:bg-cyan-400/6", delay: 3, duration: 25 },
    { className: "left-[25%] bottom-[5%] h-[450px] w-[450px] bg-pink-500/10 dark:bg-pink-500/5", delay: 5, duration: 22 },
    { className: "right-[20%] bottom-[15%] h-[350px] w-[350px] bg-blue-500/10 dark:bg-blue-500/5", delay: 2, duration: 28 },
    { className: "left-[50%] top-[35%] h-[300px] w-[300px] bg-violet-500/10 dark:bg-violet-400/5", delay: 7, duration: 24 },
];

export function AnimatedBg() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            {/* Base gradient with aurora feel */}
            <div className="absolute inset-0 bg-linear-to-br from-purple-50/60 via-background to-cyan-50/40 dark:from-purple-950/40 dark:via-background dark:to-cyan-950/30" />

            {/* Aurora band — slow animated shimmer across top */}
            <motion.div
                className="absolute -top-1/2 left-0 h-full w-[200%] opacity-30 dark:opacity-20"
                style={{
                    background: "linear-gradient(120deg, transparent 20%, rgba(168,85,247,0.08) 30%, rgba(34,211,238,0.06) 40%, rgba(236,72,153,0.05) 50%, transparent 60%)",
                }}
                animate={{ x: ["-25%", "0%", "-25%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating orbs with very slow drift */}
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className={`absolute rounded-full blur-[100px] ${orb.className}`}
                    animate={{
                        y: [0, -40, 15, -25, 0],
                        x: [0, 20, -15, 25, 0],
                        scale: [1, 1.08, 0.96, 1.04, 1],
                    }}
                    transition={{ duration: orb.duration, repeat: Infinity, delay: orb.delay, ease: "easeInOut" }}
                />
            ))}

            {/* Subtle grid lines — modern CSS grid look */}
            <div
                className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                        linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: "200px 200px",
                }}
            />

            {/* Top + bottom vignettes */}
            <div className="absolute inset-x-0 top-0 h-60 bg-linear-to-b from-background via-background/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent" />
        </div>
    );
}
