"use client";

import { useActionState, useState } from "react";

import {
  createCreatorSilverKeyInviteAction,
  type CreatorSilverKeyInviteActionState,
} from "@/app/admin/account-access/actions";

const INITIAL_STATE: CreatorSilverKeyInviteActionState = { status: "idle" };

export function CreatorSilverKeyInviteForm() {
  const [state, formAction, pending] = useActionState(
    createCreatorSilverKeyInviteAction,
    INITIAL_STATE,
  );
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (state.status !== "success") return;
    await navigator.clipboard.writeText(state.link);
    setCopied(true);
  }

  return (
    <div className="oremea-admin-surface rounded-[2rem] border p-6">
      <h2 className="text-xl font-light text-zinc-100">Give Creator Silver Key</h2>
      <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-500">
        Create a one-use link for one verified email. Claiming grants three
        Resonance room credits. Recognition and Compass each get their own
        30-day clock only when that product is first entered.
      </p>

      <form action={formAction} onSubmit={() => setCopied(false)}>
        <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Creator email
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className="oremea-admin-field mt-2 w-full rounded-xl px-4 py-3 text-sm normal-case tracking-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="oremea-admin-action mt-6 w-full rounded-full border px-5 py-3 text-xs uppercase tracking-[0.18em] transition disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create Silver Key link"}
        </button>
      </form>
      <p className="mt-3 text-xs leading-5 text-[var(--oremea-text-secondary)]">
        Creating a link does not send an email. Copy and deliver it within seven
        days. If the link is lost before it is claimed, issue another for the same
        email; the older link will be replaced.
      </p>

      {state.status === "error" ? (
        <p className="oremea-admin-feedback-error mt-4 rounded-xl border px-4 py-3 text-xs leading-5">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div className="oremea-admin-feedback-success mt-5 rounded-2xl border p-4">
          <p className="text-xs leading-5 text-zinc-300">
            Creator Silver Key invitation for {state.email}. Copy it now; Oremea
            stores only the token hash, so this raw link cannot be recovered later.
          </p>
          <input
            readOnly
            value={state.link}
            aria-label="Creator Silver Key invitation link"
            className="oremea-admin-field mt-3 w-full rounded-xl px-3 py-2.5 text-xs"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="oremea-admin-action rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition"
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
