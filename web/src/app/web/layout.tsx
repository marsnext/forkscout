import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "ForkScout Agent Dashboard",
};

export default function WebRootLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
