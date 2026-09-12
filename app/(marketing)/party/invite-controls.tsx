"use client";

import { useState } from "react";

export function PartyInviteControls({
  inviteUrl,
  funnelUrl,
  remainingInvites,
}: {
  inviteUrl: string;
  funnelUrl: string;
  remainingInvites: number;
}) {
  const [copied, setCopied] = useState(false);
  const unavailable = remainingInvites <= 0;
  const inviteText = `I’m joining a free live Oremea session called “What Keeps Repeating in Connection?” If this conversation would be useful to you, here’s one of my guest invitations: ${inviteUrl}\n\nCurious about Oremea before the live session? Resonance starts here: ${funnelUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  async function copyInvite() {
    if (unavailable) return;
    await navigator.clipboard.writeText(inviteText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-6">
      <p className="text-lg leading-7 text-zinc-200">
        {remainingInvites === 2
          ? "2 guest invitations remaining"
          : remainingInvites === 1
            ? "1 guest invitation remaining"
            : "Both guest invitations have been used"}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {unavailable ? (
          <span className="rounded-full border border-white/10 px-5 py-3 text-center text-base text-zinc-500">
            WhatsApp invitation used
          </span>
        ) : (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#c8a96a]/55 px-5 py-3 text-center text-base text-[#f1dfb4] transition hover:border-[#c8a96a] hover:bg-[#c8a96a]/10"
          >
            Invite on WhatsApp
          </a>
        )}

        <button
          type="button"
          onClick={copyInvite}
          disabled={unavailable}
          className="rounded-full border border-white/15 px-5 py-3 text-base text-zinc-200 transition hover:border-white/30 disabled:cursor-not-allowed disabled:text-zinc-600"
        >
          {unavailable
            ? "Invitation link used"
            : copied
              ? "Invitation link copied"
              : "Copy full invitation"}
        </button>
      </div>
    </div>
  );
}
