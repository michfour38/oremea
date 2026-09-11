"use client";

import { useState } from "react";

const SESSION_NAME = "What Keeps Repeating in Connection?";

export function PartyInviteControls({ inviteUrls }: { inviteUrls: string[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function copyInvite(url: string, index: number) {
    const text = `I’m joining a free live Oremea session called “${SESSION_NAME}”. I have a guest pass for you. If the conversation feels useful, claim your place here: ${url}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1800);
  }

  return (
    <div className="mt-6 grid gap-4">
      {inviteUrls.slice(0, 2).map((url, index) => {
        const inviteText = `I’m joining a free live Oremea session called “${SESSION_NAME}”. I have a guest pass for you. If the conversation feels useful, claim your place here: ${url}`;
        const whatsappHref = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
        const mailtoHref = `mailto:?subject=${encodeURIComponent(
          `A guest pass for ${SESSION_NAME}`,
        )}&body=${encodeURIComponent(inviteText)}`;

        return (
          <section
            key={url}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="text-sm text-[#f1dfb4]">Guest Pass {index + 1}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              One person can claim this pass.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <a
                href={mailtoHref}
                className="rounded-full border border-[#c8a96a]/55 px-4 py-2 text-center text-xs text-[#f1dfb4] transition hover:border-[#c8a96a] hover:bg-[#c8a96a]/10"
              >
                Send by email
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-4 py-2 text-center text-xs text-zinc-200 transition hover:border-white/30"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => copyInvite(url, index)}
                className="rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-200 transition hover:border-white/30"
              >
                {copiedIndex === index ? "Copied" : "Copy pass"}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
