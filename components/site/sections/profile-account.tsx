"use client";

import { useUser } from "@clerk/nextjs";

export function ProfileAccount() {
  const { user } = useUser();

  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-12">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Account
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-7">
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.18em] text-zinc-500">
                Name
              </p>

              <p className="text-lg text-zinc-200">
                {user?.fullName || "Oremea Member"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.18em] text-zinc-500">
                Email
              </p>

              <p className="text-lg text-zinc-200">
                {user?.primaryEmailAddress?.emailAddress || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.18em] text-zinc-500">
                Member Since
              </p>

              <p className="text-lg text-zinc-200">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.18em] text-zinc-500">
                Participation Style
              </p>

              <p className="text-lg text-zinc-200">
                Self-led reflective participation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
