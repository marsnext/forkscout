"use client";

export function ForkScoutLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            fill="none"
            width={size}
            height={size}
            className={className}
        >
            {/* Handle */}
            <path d="M32 58 V30" stroke="url(#fsl-g1)" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Base curves */}
            <path d="M16 30 Q16 22 24 18" stroke="url(#fsl-g1)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M48 30 Q48 22 40 18" stroke="url(#fsl-g1)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M32 30 V18" stroke="url(#fsl-g1)" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Crossbar */}
            <path d="M16 30 H48" stroke="url(#fsl-g1)" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Prong tips */}
            <path d="M24 18 V6" stroke="url(#fsl-g2)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M32 18 V6" stroke="url(#fsl-g2)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M40 18 V6" stroke="url(#fsl-g2)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <defs>
                <linearGradient id="fsl-g1" x1="32" y1="58" x2="32" y2="18">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="fsl-g2" x1="32" y1="18" x2="32" y2="6">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
            </defs>
        </svg>
    );
}
