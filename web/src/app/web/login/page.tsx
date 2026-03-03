"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, KeyRound, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/web/auth-provider";
import { setApiUrl, getApiUrl, setToken, validateToken } from "@/lib/api-client";

export default function LoginPage() {
    return <Suspense><LoginInner /></Suspense>;
}

function LoginInner() {
    const router = useRouter();
    const params = useSearchParams();
    const { login } = useAuth();
    const [token, setTokenInput] = useState(params.get("token") ?? "");
    const [apiUrl, setApiInput] = useState(getApiUrl());
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError("");
        if (!token.trim()) { setError("Token is required"); return; }
        setLoading(true);
        try {
            setApiUrl(apiUrl);
            setToken(token.trim());
            const valid = await validateToken();
            if (!valid) {
                setError("Invalid token or agent is not running");
                setLoading(false);
                return;
            }
            login(token.trim());
            router.replace("/web");
        } catch {
            setError("Could not connect to agent");
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <motion.div initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm">
                {/* Card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-8 backdrop-blur-xl">
                    {/* Glow */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
                                <Bot className="h-7 w-7 text-purple-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">
                                    Fork<span className="bg-linear-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">Scout</span>
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">Enter your auth token to connect</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="api-url" className="text-xs text-muted-foreground">Agent URL</Label>
                                <Input id="api-url" value={apiUrl}
                                    onChange={(e) => setApiInput(e.target.value)}
                                    placeholder="http://127.0.0.1:3200"
                                    className="h-10 bg-background/50 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="token" className="text-xs text-muted-foreground">
                                    <KeyRound className="mr-1 inline h-3 w-3" /> Auth Token
                                </Label>
                                <Input id="token" type="password" value={token}
                                    onChange={(e) => setTokenInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                    placeholder="Paste your token here"
                                    className="h-10 bg-background/50 font-mono text-sm" autoFocus />
                            </div>

                            {error && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-1.5 text-sm text-destructive">
                                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                                </motion.p>
                            )}

                            <Button onClick={handleLogin} disabled={loading}
                                className="w-full gap-2 bg-linear-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400">
                                {loading ? "Connecting..." : "Connect"} <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="text-center text-[11px] leading-relaxed text-muted-foreground/60">
                            Run <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">forkscout web</code> to get your token
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
