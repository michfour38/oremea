"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CURRENT_PRICING,
  formatCurrentPrice,
} from "@/src/lib/current/current-pricing";

type Invitation = {
  id: string;
  sourceProduct: string;
  createdAt: string;
};

type CurrentStatus = {
  member: boolean;
  current?: {
    active: boolean;
    expiresAt: string | null;
    accessUrl: string | null;
    checkoutAvailable: boolean;
  };
  pendingInvitations?: Invitation[];
};

function productLabel(value: string) {
  if (value === "recognition") return "Recognition";
  if (value === "resonance") return "Resonance";
  if (value === "compass") return "Compass";
  return "Oremea";
}

export function CurrentPanel() {
  const [status, setStatus] = useState<CurrentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/current/status", { cache: "no-store" });
    const data = (await response.json()) as CurrentStatus;
    setStatus(data);
    return data;
  }

  useEffect(() => {
    void refresh()
      .catch(() => setMessage("The Current status could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  async function act(invitationId: string, action: "accept" | "decline") {
    if (busyId) return;
    setBusyId(invitationId);
    setMessage("");

    try {
      const response = await fetch(`/api/current/invitations/${invitationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "This invitation could not be updated.");
        return;
      }

      if (action === "accept" && typeof data?.checkoutUrl === "string") {
        window.location.assign(data.checkoutUrl);
        return;
      }

      window.dispatchEvent(new Event("current-invitation-changed"));
      await refresh();
    } catch {
      setMessage("This invitation could not be updated just now.");
    } finally {
      setBusyId(null);
    }
  }

  const invitations = status?.pendingInvitations ?? [];
  const currentPrice = formatCurrentPrice(CURRENT_PRICING.standardPriceCents);

  return (
    <section className="border-b border-white/5 bg-zinc-950/65">
      <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.26em] text-[#b79a63]">
          Member space
        </p>
        <h1 className="mt-4 text-4xl font-light text-white md:text-6xl">
          The Current
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
          The shared Oremea member space. Entry is offered through participation in Oremea and remains a separate choice.
        </p>

        {loading ? (
          <div className="mt-8 h-48 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
        ) : null}

        {!loading && status?.current?.active ? (
          <div className="mt-8 rounded-3xl border border-[#b79a63]/30 bg-[#b79a63]/[0.06] p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#b79a63]">
              Active membership
            </p>
            <h2 className="mt-3 text-2xl font-light text-white">
              You are in The Current.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
              Your Current membership is active. Private Oremea product conversations remain private unless you deliberately choose to share something yourself.
            </p>
            {status.current.accessUrl ? (
              <a
                href={status.current.accessUrl}
                className="mt-6 inline-flex rounded-full bg-[#b79a63] px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:brightness-110"
              >
                Open The Current →
              </a>
            ) : null}
          </div>
        ) : null}

        {!loading && !status?.current?.active && invitations.length > 0 ? (
          <div className="mt-8 space-y-4">
            {invitations.map((invitation) => (
              <article
                key={invitation.id}
                className="rounded-3xl border border-[#b79a63]/30 bg-black/30 p-6 md:p-8"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#b79a63]">
                  Invitation through {productLabel(invitation.sourceProduct)}
                </p>
                <h2 className="mt-3 text-2xl font-light text-white">
                  An invitation to The Current
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                  Your participation opened this invitation. The Current is a separate {currentPrice} / month membership. Opening this invitation does not accept it; it remains here until you choose.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => void act(invitation.id, "accept")}
                    className="rounded-full bg-[#b79a63] px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                  >
                    {busyId === invitation.id ? "Opening…" : "Continue to payment"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => void act(invitation.id, "decline")}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-white/35 hover:text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    Decline this invitation
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !status?.current?.active && invitations.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/25 p-6 md:p-8">
            <h2 className="text-2xl font-light text-white">
              Missed your invitation?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Current invitations are tied to actual Oremea participation. If one is still pending on this account, it will reappear here and in your notification bell.
            </p>
            <button
              type="button"
              onClick={() => {
                setMessage("Checking your participation record…");
                void refresh()
                  .then((next) =>
                    setMessage(
                      (next.pendingInvitations?.length ?? 0) > 0
                        ? "Your invitation is available above."
                        : "No Current invitation is waiting on this account right now.",
                    ),
                  )
                  .catch(() => setMessage("Your eligibility could not be checked just now."));
              }}
              className="mt-5 rounded-full border border-[#b79a63]/35 bg-[#b79a63]/[0.05] px-5 py-2.5 text-sm text-[#e7c98b] transition hover:border-[#b79a63]/70 hover:bg-[#b79a63]/10"
            >
              Check eligibility
            </button>
          </div>
        ) : null}

        {message ? (
          <p className="mt-4 text-sm leading-6 text-zinc-400">{message}</p>
        ) : null}

        <div className="mt-8 border-t border-white/10 pt-5 text-sm text-zinc-400">
          Need help finding or using an invitation?{" "}
          <Link
            href="/contact"
            className="text-[#e7c98b] underline decoration-[#b79a63]/35 underline-offset-4 transition hover:decoration-[#b79a63]"
          >
            Contact support
          </Link>
          .
        </div>
      </div>
    </section>
  );
}
