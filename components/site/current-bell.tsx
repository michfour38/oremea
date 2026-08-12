"use client";

import { useEffect, useRef, useState } from "react";

import {
  CURRENT_PRICING,
  formatCurrentPrice,
} from "@/src/lib/current/current-pricing";

type CurrentInvitation = {
  id: string;
  sourceProduct: string;
  createdAt: string;
};

type CurrentStatus = {
  member: boolean;
  pendingInvitations?: CurrentInvitation[];
};

function productLabel(value: string) {
  if (value === "recognition") return "Recognition";
  if (value === "resonance") return "Resonance";
  if (value === "compass") return "Compass";
  return "Oremea";
}

export function CurrentBell({ signedIn }: { signedIn: boolean }) {
  const [status, setStatus] = useState<CurrentStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    if (!signedIn) {
      setStatus(null);
      return;
    }

    try {
      const response = await fetch("/api/current/status", { cache: "no-store" });
      const data = (await response.json()) as CurrentStatus;
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    void refresh();
    const handleChanged = () => void refresh();
    window.addEventListener("current-invitation-changed", handleChanged);
    return () =>
      window.removeEventListener("current-invitation-changed", handleChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const invitations = status?.pendingInvitations ?? [];

  // The bell is a notification, not permanent navigation. No unresolved
  // invitation means there is nothing to display in the header.
  if (!signedIn || !status?.member || invitations.length === 0) return null;

  const currentPrice = formatCurrentPrice(CURRENT_PRICING.standardPriceCents);

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#b79a63]/35 bg-black/20 text-[#e7c98b] transition hover:border-[#b79a63]/70"
        aria-label={`${invitations.length} Oremea notification${invitations.length === 1 ? "" : "s"}`}
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[18px] w-[18px] fill-none stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        <span
          className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-[#d8b875]"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[220] w-[min(92vw,390px)] rounded-[1.5rem] border border-white/10 bg-zinc-950/98 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.62)] backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#b79a63]">
            An invitation
          </p>
          <p className="mt-2 text-lg font-light text-white">The Current</p>

          <div className="mt-4 space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-2xl border border-[#b79a63]/25 bg-[#b79a63]/[0.05] p-4"
              >
                <p className="text-sm leading-6 text-zinc-300">
                  Your participation in {productLabel(invitation.sourceProduct)} opened this invitation. The Current is a separate {currentPrice} / month membership.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => void act(invitation.id, "accept")}
                    className="rounded-full bg-[#b79a63] px-4 py-2 text-sm font-medium text-zinc-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                  >
                    {busyId === invitation.id ? "Opening…" : "Enter The Current"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => void act(invitation.id, "decline")}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/35 hover:text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>

          {message ? (
            <p className="mt-3 text-xs leading-5 text-zinc-400">{message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
