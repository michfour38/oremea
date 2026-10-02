"use client";

import { useActionState, useState } from "react";

import {
  createEternalKeyInviteAction,
  type GoldenKeyInviteActionState,
} from "@/app/admin/account-access/actions";

const INITIAL_STATE: GoldenKeyInviteActionState = { status: "idle" };

export function GoldenKeyInviteForm() {
  const [state, formAction, pending] = useActionState(
    createEternalKeyInviteAction,
    INITIAL_STATE,
  );
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (state.status !== "success") return;
    await navigator.clipboard.writeText(state.link);
    setCopied(true);
  }

  return (
    <div className="rounded-[2rem] border border-[#b79a63]/25 bg-black/40 p-6">
      <h2 className="text-xl font-light text-zinc-100">Give Golden Key</h2>
      <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-500">
        Create a one-use link for one verified email. The link lasts seven days;
        the ∞ All Access Key it issues does not expire.
      </p>

      <form action={formAction} onSubmit={() => setCopied(false)}>
        <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Recipient email
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm normal-case tracking-normal text-zinc-100 outline-none transition focus:border-[#b79a63]/60"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full border border-[#b79a63]/35 bg-[#b79a63]/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-[#e7c98b] transition hover:border-[#b79a63]/70 disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create Golden Key link"}
        </button>
      </form>

      {state.status === "error" ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-200">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-5 rounded-2xl border border-[#b79a63]/25 bg-[#b79a63]/[0.06] p-4">
          <p className="text-xs leading-5 text-[#ead6a9]">
            Golden Key invitation for {state.email}. Copy it now; Oremea stores
            only the token hash, so this raw link cannot be recovered later.
          </p>
          <input
            readOnly
            value={state.link}
            aria-label="Golden Key invitation link"
            className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-300 outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full border border-[#b79a63]/35 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#e7c98b] transition hover:border-[#b79a63]/70"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <span className="text-[11px] text-zinc-600">
              Expires {new Date(state.expiresAt).toLocaleString("en-ZA")}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
