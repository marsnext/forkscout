"use client";

import { AuthProvider } from "@/components/web/auth-provider";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
