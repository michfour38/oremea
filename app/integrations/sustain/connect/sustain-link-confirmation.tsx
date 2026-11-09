"use client";

import Link from "next/link";
import { useState } from "react";
import type { SustainProduct } from "@/src/lib/integrations/sustain-bridge";

export default function SustainLinkConfirmation({
  code, product, destination,
}: { code: string; product: SustainProduct; destination: string }) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/integrations/sustain/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, product, confirmed: true }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("link_unavailable");
      setSuccess(true);
    } catch {
      setError("This connection could not be completed — return to SUSTAIN and create a new link");
    } finally {
      setBusy(false);
    }
  }

  if (success) return <div role="status">
    <p>Connected — only references approved in SUSTAIN are available to this product</p>
    <Link href={destination}>Open {product[0].toUpperCase() + product.slice(1)}</Link>
  </div>;
  return <div>
    <button type="button" disabled={busy} onClick={connect}
      style={{ padding: "12px 20px", background: "#cda868", color: "#151515", borderRadius: 10, fontWeight: 700 }}>
      {busy ? "Connecting…" : "Confirm connection"}
    </button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
