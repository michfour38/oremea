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
    <div className="oremea-admin-surface rounded-[2rem] border p-6">
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
            className="oremea-admin-field mt-2 w-full rounded-xl px-4 py-3 text-sm normal-case tracking-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="oremea-admin-action mt-6 w-full rounded-full border px-5 py-3 text-xs uppercase tracking-[0.18em] transition disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create Golden Key link"}
        </button>
      </form>

      {state.status === "error" ? (
        <p className="oremea-admin-feedback-error mt-4 rounded-xl border px-4 py-3 text-xs leading-5">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div className="oremea-admin-feedback-success mt-5 rounded-2xl border p-4">
          <p className="text-xs leading-5 text-[var(--oremea-text-primary)]">
            Golden Key invitation for {state.email}. Copy it now; Oremea stores
            only the token hash, so this raw link cannot be recovered later.
          </p>
          <input
            readOnly
            value={state.link}
            aria-label="Golden Key invitation link"
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
