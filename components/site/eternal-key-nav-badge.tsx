"use client";

import { useEffect, useState } from "react";

export function EternalKeyNavBadge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/account/status", { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!cancelled) {
          setVisible(Boolean(response.ok && data?.hasEternalKey));
        }
      } catch {
        if (!cancelled) setVisible(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <a
      href="https://www.oremea.com/key"
      aria-label="Open your eternal Oremea key"
      title="Eternal Oremea key · ∞ All Access"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C8A96A]/35 bg-[#C8A96A]/10 text-[#E7C98B] shadow-[0_0_18px_rgba(200,169,106,0.12)] transition hover:border-[#C8A96A]/70 hover:bg-[#C8A96A]/15 hover:text-[#F1DFB4]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 12h9m-3 0v3m-3-3v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </a>
  );
}
