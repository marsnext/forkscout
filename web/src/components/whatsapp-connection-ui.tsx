"use client";

import { Play, QrCode, RefreshCw, WifiOff } from "lucide-react";

interface WhatsAppStatus {
    connected: boolean;
    started?: boolean;
    qr?: string;
    jid?: string;
}

/** Displays the QR code image for scanning. */
export function QrCodeDisplay({ qr }: { qr: string }) {
    return (
        <div className="text-center">
            <p className="mb-3 text-sm text-muted-foreground">
                Scan this QR code with WhatsApp to connect:
            </p>
            <div className="mx-auto inline-block rounded-xl border border-border bg-white p-4">
                {qr.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="WhatsApp QR" className="h-64 w-64" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 w-64">
                        <QrCode className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-2 text-xs text-muted-foreground break-all">
                            QR available in terminal
                        </p>
                    </div>
                )}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground/80">How to scan:</p>
                <p>1. Open WhatsApp → <span className="font-medium">Settings → Linked Devices</span></p>
                <p>2. Tap <span className="font-medium">Link a Device</span> → scan this QR</p>
            </div>
        </div>
    );
}

/** Simple connect button — triggers QR code flow. */
export function ConnectButton({
    status,
    connecting,
    onConnect,
}: {
    status: WhatsAppStatus | null;
    connecting: boolean;
    onConnect: () => void;
}) {
    if (status?.started) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">Connecting…</p>
                    <p className="text-xs text-muted-foreground">
                        Waiting for WhatsApp server response.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                    <p className="text-sm font-medium">Not connected</p>
                    <p className="text-xs text-muted-foreground">
                        Click Connect to get a QR code for linking your WhatsApp.
                    </p>
                </div>
                <button
                    onClick={onConnect}
                    disabled={connecting}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                >
                    {connecting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Play className="h-3.5 w-3.5" />
                    )}
                    {connecting ? "Connecting…" : "Connect"}
                </button>
            </div>
        </div>
    );
}
