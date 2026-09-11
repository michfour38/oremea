"use client";

import { useState } from "react";

export function PartyInviteControls({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const inviteText = `I’m joining a free live Oremea session called “What Keeps Repeating in Connection?” If this conversation would be useful to you, here’s an invitation: ${inviteUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-[#c8a96a]/55 px-5 py-3 text-center text-sm text-[#f1dfb4] transition hover:border-[#c8a96a] hover:bg-[#c8a96a]/10"
      >
        Invite someone on WhatsApp
      </a>
      <button
        type="button"
        onClick={copyInvite}
        className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30"
      >
        {copied ? "Invitation link copied" : "Copy invitation link"}
      </button>
    </div>
  );
}
