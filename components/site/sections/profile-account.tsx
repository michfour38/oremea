"use client";

import { useUser } from "@clerk/nextjs";

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
  const { isLoaded, user } = useUser();
  const displayName = user?.fullName || user?.firstName || "Oremea Member";
  const initials = initialsFor(displayName) || "O";

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

          <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-100 sm:inline-flex">
            Signed in
          </span>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/55 shadow-2xl shadow-black/20 backdrop-blur-md">
          <div className="grid md:grid-cols-[17rem_minmax(0,1fr)]">
            <div className="border-b border-white/10 bg-gradient-to-br from-amber-100/[0.09] to-transparent p-6 md:border-b-0 md:border-r md:p-8">
              <div className="flex items-center gap-4 md:block">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-100/25 bg-amber-100/[0.07] text-xl tracking-[0.12em] text-amber-100 md:h-20 md:w-20 md:text-2xl">
                  {isLoaded ? initials : ""}
                </div>
                <div className="md:mt-6">
                  <p className="text-xl font-light text-white md:text-2xl">
                    {isLoaded ? displayName : "Loading your account…"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Oremea participant
                  </p>
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
                value={isLoaded ? formatMemberSince(user?.createdAt) : "Loading…"}
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
