// src/channels/whatsapp/state.ts — Exported WhatsApp runtime state for dashboard API
//
// The WhatsApp channel writes to this module; the self-channel HTTP server reads from it.
// This avoids coupling the two channels directly.

import QRCode from "qrcode";

export interface WhatsAppState {
    connected: boolean;
    started: boolean; // true once the channel has been launched (even if not yet connected)
    qr: string; // data:image/png;base64,... QR image (empty if connected or not started)
    jid: string; // own JID once connected
}

const state: WhatsAppState = {
    connected: false,
    started: false,
    qr: "",
    jid: "",
};

export function setWhatsAppStarted(): void {
    state.started = true;
}

export function setWhatsAppConnected(jid: string): void {
    state.connected = true;
    state.started = true;
    state.qr = "";
    state.jid = jid;
}

export async function setWhatsAppQR(rawQr: string): Promise<void> {
    try {
        // Convert raw Baileys QR string → data:image/png;base64,...
        state.qr = await QRCode.toDataURL(rawQr, { width: 512, margin: 2 });
    } catch {
        state.qr = rawQr; // fallback to raw string
    }
    state.connected = false;
}

export function setWhatsAppDisconnected(): void {
    state.connected = false;
    state.qr = "";
}

/** Full reset — pairing failed or session deleted. User can click Connect again. */
export function resetWhatsAppState(): void {
    state.connected = false;
    state.started = false;
    state.qr = "";
    state.jid = "";
}

export function getWhatsAppState(): WhatsAppState {
    return { ...state };
}
