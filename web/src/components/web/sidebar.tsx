"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard, MessageSquare, Settings, KeyRound,
    LogOut, Bot, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "./auth-provider";
import { useState } from "react";

const navItems = [
    { href: "/web", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/web/chat", icon: MessageSquare, label: "Chat" },
    { href: "/web/settings", icon: Settings, label: "Settings" },
    { href: "/web/env", icon: KeyRound, label: "Env & Secrets" },
];

export function WebSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`flex h-screen flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 border-b border-border/40 px-4 py-4">
                <Bot className="h-6 w-6 shrink-0 text-purple-500" />
                {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-base font-bold tracking-tight">
                        Fork<span className="bg-linear-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">Scout</span>
                    </motion.span>
                )}
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto h-7 w-7 text-muted-foreground hover:text-foreground">
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-1 px-2 py-3">
                {navItems.map((item) => {
                    const active = pathname === item.href || (item.href !== "/web" && pathname.startsWith(item.href));
                    const content = (
                        <Link key={item.href} href={item.href}
                            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${active
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                            <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-purple-500" : ""}`} />
                            {!collapsed && <span>{item.label}</span>}
                            {active && (
                                <motion.div layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-purple-500"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                            )}
                        </Link>
                    );
                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{content}</TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        );
                    }
                    return content;
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-border/40 px-2 py-3">
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" onClick={logout}
                            className="w-full justify-start gap-3 text-muted-foreground hover:text-red-500">
                            <LogOut className="h-4.5 w-4.5 shrink-0" />
                            {!collapsed && <span className="text-sm">Logout</span>}
                        </Button>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
                </Tooltip>
            </div>
        </aside>
    );
}
