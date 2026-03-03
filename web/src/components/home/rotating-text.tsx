"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const phrases = [
    "Runs shell commands",
    "Browses the web",
    "Reads & writes files",
    "Remembers everything",
    "Modifies its own code",
    "Deploys itself",
    "Searches the internet",
    "Multi-channel agent",
    "Self-healing & autonomous",
];

export function RotatingText() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-10 items-center justify-center overflow-hidden sm:h-14">
            <AnimatePresence mode="wait">
                <motion.span
                    key={phrases[index]}
                    initial={{ y: 24, opacity: 0, filter: "blur(6px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -24, opacity: 0, filter: "blur(6px)" }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="block bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl"
                >
                    {phrases[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
}
