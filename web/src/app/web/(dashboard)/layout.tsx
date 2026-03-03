"use client";

import { AuthProvider } from "@/components/web/auth-provider";
import { AuthGuard } from "@/components/web/auth-guard";
import { WebSidebar } from "@/components/web/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";

/** Client shell for all /web/(dashboard)/* routes — sidebar + auth gate. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TooltipProvider delayDuration={0}>
                <AuthGuard>
                    <div className="flex h-screen overflow-hidden bg-background">
                        <WebSidebar />
                        <main className="flex flex-1 flex-col overflow-y-auto">
                            {/* Top bar */}
                            <header className="sticky top-0 z-40 flex items-center justify-end border-b border-border/40 bg-background/80 px-6 py-3 backdrop-blur-xl">
                                <ThemeToggle />
                            </header>
                            <div className="flex-1 p-6">{children}</div>
                        </main>
                    </div>
                </AuthGuard>
            </TooltipProvider>
        </AuthProvider>
    );
}
