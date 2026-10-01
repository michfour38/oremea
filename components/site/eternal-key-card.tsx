"use client";

import { useClerk, useUser } from "@clerk/nextjs";

export function EternalKeyCard() {
  const { openUserProfile } = useClerk();
  const { isLoaded, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#C8A96A]/35 bg-black/55 shadow-[0_25px_90px_rgba(0,0,0,0.35)]">
      <div className="border-b border-[#C8A96A]/20 bg-[#C8A96A]/[0.06] px-7 py-8 md:px-10">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C8A96A]/45 bg-black/40 text-[#E7C98B] shadow-[0_0_35px_rgba(200,169,106,0.14)]">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
              <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 12h9m-3 0v3m-3-3v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C8A96A]">Oremea Key</p>
            <h1 className="mt-2 text-3xl font-light text-zinc-100 md:text-5xl">∞ All Access</h1>
          </div>
        </div>
      </div>

      <dl className="grid gap-px bg-white/10 md:grid-cols-2">
        <KeyDetail label="Access" value="Eternal" />
        <KeyDetail label="Security state" value="Active" />
        <KeyDetail label="Recognized email" value={isLoaded ? email : "Loading…"} />
        <div className="bg-zinc-950/90 p-6 md:p-8">
          <dt className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Email security</dt>
          <dd className="mt-3 text-sm leading-6 text-zinc-300">
            Email changes are handled inside the secured account flow.
          </dd>
          <button
            type="button"
            onClick={() => openUserProfile()}
            disabled={!isLoaded}
            className="mt-5 rounded-full border border-[#C8A96A]/35 bg-[#C8A96A]/10 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-[#E7C98B] transition hover:border-[#C8A96A]/70 hover:bg-[#C8A96A]/15 disabled:cursor-wait disabled:opacity-50"
          >
            Edit email
          </button>
        </div>
      </dl>

      <div className="px-7 py-6 text-sm leading-7 text-zinc-500 md:px-10">
        The key is an access entitlement, not an account permission. A security suspension can pause entry without deleting this key.
      </div>
    </div>
  );
}

function KeyDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/90 p-6 md:p-8">
      <dt className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</dt>
      <dd className="mt-3 break-words text-base text-zinc-100">{value}</dd>
    </div>
  );
}
