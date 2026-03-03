import { ImageResponse } from "next/og";

export const alt = "ForkScout — Autonomous AI Agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #0f0521 0%, #1a0a3e 40%, #0d1117 100%)",
                    fontFamily: "sans-serif",
                }}
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 100 100"
                    fill="none"
                    style={{ marginBottom: 24 }}
                >
                    <path
                        d="M50 95 L50 55 M50 55 L20 15 M50 55 L50 15 M50 55 L80 15"
                        stroke="url(#grad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="20" cy="15" r="8" fill="#a855f7" />
                    <circle cx="50" cy="15" r="8" fill="#06b6d4" />
                    <circle cx="80" cy="15" r="8" fill="#ec4899" />
                    <circle cx="50" cy="95" r="8" fill="#a855f7" />
                    <defs>
                        <linearGradient id="grad" x1="20" y1="15" x2="80" y2="95">
                            <stop stopColor="#a855f7" />
                            <stop offset="0.5" stopColor="#06b6d4" />
                            <stop offset="1" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                </svg>
                <div
                    style={{
                        display: "flex",
                        fontSize: 72,
                        fontWeight: 800,
                        background: "linear-gradient(to right, #a855f7, #06b6d4, #ec4899)",
                        backgroundClip: "text",
                        color: "transparent",
                    }}
                >
                    ForkScout
                </div>
                <div style={{ fontSize: 28, color: "#94a3b8", marginTop: 16, fontWeight: 500 }}>
                    Autonomous AI Agent
                </div>
            </div>
        ),
        { ...size }
    );
}
