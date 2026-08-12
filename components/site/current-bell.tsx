"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  CURRENT_PRICING,
  formatCurrentPrice,
} from "@/src/lib/current/current-pricing";

type CurrentInvitation = {
  id: string;
  sourceProduct: string;
  sourceInstanceId: string;
  triggerKey: string;
  checkoutStartedAt: string | null;
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

    function handleChanged() {
      void refresh();
    }

    window.addEventListener("current-invitation-changed", handleChanged);
    return () =>
      window.removeEventListener("current-invitation-changed", handleChanged);
    // refresh is intentionally tied to signed-in state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  if (!signedIn || !status?.member) return null;

  const invitations = status.pendingInvitations ?? [];
  const hasPending = invitations.length > 0;
  const currentActive = Boolean(status.current?.active);
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
        onClick={() => {
          setOpen((value) => !value);
          setMessage("");
          void refresh();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-zinc-300 transition hover:border-[#b79a63]/45 hover:text-[#e7c98b]"
        aria-label={
          hasPending
            ? `${invitations.length} pending Oremea notification${invitations.length === 1 ? "" : "s"}`
            : "Oremea notifications"
        }
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

        {hasPending ? (
          <span
            className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-[#d8b875]"
            aria-hidden="true"
          />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[220] w-[min(92vw,390px)] rounded-[1.5rem] border border-white/10 bg-zinc-950/98 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.62)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#b79a63]">
                Notifications
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Oremea keeps invitations here until you choose what to do with them.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          {currentActive ? (
            <div className="mt-4 rounded-2xl border border-[#b79a63]/25 bg-[#b79a63]/[0.06] p-4">
              <p className="text-sm font-medium text-[#e7c98b]">The Current</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Your membership is active.
              </p>
              {status.current?.accessUrl ? (
                <a
                  href={status.current.accessUrl}
                  className="mt-3 inline-flex text-sm text-[#e7c98b] underline decoration-[#b79a63]/35 underline-offset-4 transition hover:decoration-[#b79a63]"
                >
                  Open The Current →
                </a>
              ) : null}
            </div>
          ) : hasPending ? (
            <div className="mt-4 space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-2xl border border-[#b79a63]/25 bg-[#b79a63]/[0.05] p-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b79a63]">
                    An invitation
                  </p>
                  <p className="mt-2 text-lg font-light text-white">
                    The Current
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
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
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-sm font-medium text-zinc-100">
                Missed your invitation to The Current?
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                If an invitation is still eligible on this account, it remains here until you accept or decline it.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMessage("Checking your Oremea participation record…");
                  void refresh().then(() =>
                    setMessage("No Current invitation is waiting on this account right now."),
                  );
                }}
                className="mt-3 text-sm text-[#e7c98b] underline decoration-[#b79a63]/35 underline-offset-4 transition hover:decoration-[#b79a63]"
              >
                Check eligibility
              </button>
            </div>
          )}

          {message ? (
            <p className="mt-3 text-xs leading-5 text-zinc-400">{message}</p>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <Link
              href="/current"
              onClick={() => setOpen(false)}
              className="text-zinc-300 transition hover:text-white"
            >
              The Current
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="text-zinc-400 transition hover:text-[#e7c98b]"
            >
              Contact support
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
