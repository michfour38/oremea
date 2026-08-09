"use client";

import { useClerk, useUser } from "@clerk/nextjs";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMemberSince(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ProfileAccount() {
  const { openUserProfile } = useClerk();
  const { isLoaded, user } = useUser();
  const displayName = user?.fullName || user?.firstName || "Oremea Member";
  const initials = initialsFor(displayName) || "O";
  const imageUrl = user?.hasImage ? user.imageUrl : null;

  return (
    <section className="border-b border-white/5 bg-black/25">
      <div className="mx-auto max-w-6xl px-5 py-7 md:py-8">
        <div className="mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
              Account
            </p>
            <h2 className="mt-2 text-2xl font-light text-zinc-100">
              Account details
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 shadow-xl shadow-black/15 backdrop-blur-md">
          <div className="grid md:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="border-b border-white/10 bg-[#b79a63]/[0.045] p-5 md:border-b-0 md:border-r md:p-6">
              <div className="flex items-center gap-4 md:block">
                <button
                  type="button"
                  onClick={() => openUserProfile()}
                  disabled={!isLoaded}
                  className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#b79a63]/35 bg-[#b79a63]/[0.06] text-lg tracking-[0.12em] text-[#b79a63] transition hover:border-[#b79a63]/70 focus:outline-none focus:ring-2 focus:ring-[#b79a63]/40 disabled:cursor-wait md:h-16 md:w-16 md:text-xl"
                  aria-label="Open account settings to update your profile photo"
                >
                  {isLoaded && imageUrl ? (
                    // Clerk imports the account image supplied by Google sign-in.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{isLoaded ? initials : ""}</span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-zinc-950/85 py-1 text-[8px] uppercase tracking-[0.12em] text-[#b79a63] opacity-0 transition group-hover:opacity-100">
                    Edit
                  </span>
                </button>
                <div className="md:mt-4">
                  <p className="text-lg font-light text-zinc-100 md:text-xl">
                    {isLoaded ? displayName : "Loading your account…"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Oremea participant
                  </p>
                  <button
                    type="button"
                    onClick={() => openUserProfile()}
                    disabled={!isLoaded}
                    className="mt-2 text-xs text-[#b79a63]/75 underline decoration-[#b79a63]/30 underline-offset-4 transition hover:text-[#b79a63] disabled:text-zinc-600"
                  >
                    Update profile photo
                  </button>
                </div>
              </div>
            </div>

            <dl className="grid gap-px bg-white/10 sm:grid-cols-2">
              <AccountDetail
                label="Email"
                value={
                  isLoaded
                    ? user?.primaryEmailAddress?.emailAddress || "—"
                    : "Loading…"
                }
              />
              <AccountDetail
                label="Member since"
                value={
                  isLoaded ? formatMemberSince(user?.createdAt) : "Loading…"
                }
              />
              <AccountDetail label="Participation" value="Self-led" />
              <AccountDetail label="Reflection record" value="Private" />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-zinc-950/90 p-5 md:p-6">
      <dt className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm text-zinc-200 md:text-base">
        {value}
      </dd>
    </div>
  );
}
