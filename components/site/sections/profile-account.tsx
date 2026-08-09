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
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
              Account
            </p>
            <h2 className="mt-3 text-2xl font-light text-zinc-100 md:text-3xl">
              The person behind the participation
            </h2>
          </div>

          <span className="hidden rounded-full border border-amber-100/20 bg-amber-100/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-100 sm:inline-flex">
            Signed in
          </span>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/55 shadow-2xl shadow-black/20 backdrop-blur-md">
          <div className="grid md:grid-cols-[17rem_minmax(0,1fr)]">
            <div className="border-b border-white/10 bg-gradient-to-br from-amber-100/[0.09] to-transparent p-6 md:border-b-0 md:border-r md:p-8">
              <div className="flex items-center gap-4 md:block">
                <button
                  type="button"
                  onClick={() => openUserProfile()}
                  disabled={!isLoaded}
                  className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-100/30 bg-amber-100/[0.07] text-xl tracking-[0.12em] text-amber-100 transition hover:border-amber-100/70 focus:outline-none focus:ring-2 focus:ring-amber-100/50 disabled:cursor-wait md:h-20 md:w-20 md:text-2xl"
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
                  <span className="absolute inset-x-0 bottom-0 bg-zinc-950/85 py-1 text-[8px] uppercase tracking-[0.12em] text-amber-100 opacity-0 transition group-hover:opacity-100">
                    Edit
                  </span>
                </button>
                <div className="md:mt-6">
                  <p className="text-xl font-light text-white md:text-2xl">
                    {isLoaded ? displayName : "Loading your account…"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Oremea participant
                  </p>
                  <button
                    type="button"
                    onClick={() => openUserProfile()}
                    disabled={!isLoaded}
                    className="mt-3 text-xs text-amber-100/70 underline decoration-amber-100/25 underline-offset-4 transition hover:text-amber-100 disabled:text-zinc-600"
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
    <div className="min-w-0 bg-zinc-950/90 p-6 md:p-8">
      <dt className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-3 break-words text-base text-zinc-200 md:text-lg">
        {value}
      </dd>
    </div>
  );
}
