"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CurrentStatus = {
  member: boolean;
  current?: {
    active: boolean;
    accessUrl: string | null;
  };
  pendingInvitations?: Array<{ id: string }>;
};

export function ProfileCurrent() {
  const [status, setStatus] = useState<CurrentStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/current/status", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => setStatus(data as CurrentStatus))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  if (!status?.member) return null;

  const active = Boolean(status.current?.active);
  const pending = (status.pendingInvitations?.length ?? 0) > 0;

  return (
    <section className="border-b border-white/5 bg-black/20">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <article className="overflow-hidden rounded-3xl border border-[#b79a63]/20 bg-zinc-950/80 p-6 shadow-xl shadow-black/20 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
                The Current
              </p>
              <h2 className="mt-3 text-2xl font-light text-white md:text-3xl">
                {active
                  ? "Your shared Oremea space"
                  : pending
                    ? "An invitation is waiting"
                    : "A shared space that opens through participation"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {active
                  ? "Your Current membership is active. Private product conversations remain separate from what you choose to share there."
                  : pending
                    ? "Your participation has opened an invitation. It will remain in your notification bell until you accept or decline it."
                    : "This card appears because you have purchased an Oremea product. The Current itself is offered only after qualifying participation."}
              </p>
            </div>

            <Link
              href="/current"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#b79a63]/35 bg-[#b79a63]/[0.05] px-5 py-2.5 text-sm text-[#e7c98b] transition hover:border-[#b79a63]/70 hover:bg-[#b79a63]/10"
            >
              {active ? "Open The Current" : pending ? "View invitation" : "The Current"} →
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
