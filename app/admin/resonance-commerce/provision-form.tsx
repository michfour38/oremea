"use client";

import { useState } from "react";
import Link from "next/link";

export function ProvisionForm({ enabled: _enabled, children: _children }: { enabled: boolean; children: React.ReactNode }) {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <section className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5" aria-label="Provisioning safety warning">
      <p className="font-medium text-amber-100">Safety stop · Whop provisioning is locked</p>
      <p className="mt-2 text-sm leading-6 text-zinc-300">
        Provisioning can create real payment resources. The configured API key alone does not verify that the catalogue, prices and webhook are safe to change.
        No provisioning will be performed here until a read-only preflight and explicit approval flow are implemented.
      </p>
      <label className="mt-5 flex items-start gap-3 text-sm text-zinc-200">
        <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1 h-4 w-4 accent-amber-300" />
        I understand. Return to safety without changing Whop.
      </label>
      <div className="mt-5">
        {acknowledged ? (
          <Link href="/admin" className="inline-flex min-h-11 items-center rounded-full border border-[#b79a63]/50 bg-[#b79a63]/10 px-6 py-3 text-sm text-[#e2c78e] hover:border-[#b79a63]/80">Return safely to Oremea Admin ↗</Link>
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-6 py-3 text-sm text-zinc-500">Tick the checkbox to return safely</span>
        )}
      </div>
    </section>
  );
}
