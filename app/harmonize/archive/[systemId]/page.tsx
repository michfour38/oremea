"use client";
import { use } from "react";

import MemberNav from "@/app/(member)/member-nav"
import Link from "next/link"

export default function ArchivePage(
  props: {
    params: Promise<{ systemId: string }>
  }
) {
  const params = use(props.params);
  return (
    <>
      <MemberNav />

      <main
        className="min-h-screen text-[#f4f1ea]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.76), rgba(0,0,0,0.76)), url('/images/harmonize/bg-harmonize-private.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <section className="mx-auto max-w-5xl px-6 py-20">
          <Link
            href={`/harmonize/system/${params.systemId}`}
            className="text-sm text-[#c6a96b]"
          >
            ← Back to Relationship Space
          </Link>

          <p className="mt-10 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
            Harmonize by Oremea
          </p>

          <h1 className="mt-4 text-4xl font-semibold">
            Archive
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            Completed conversations and everything this Relationship Space has
            made visible over time.
          </p>

          <div className="mt-10 space-y-4">
  <Link
    href={`/harmonize/archive/${params.systemId}/conversations`}
    className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-[#c6a96b]/50"
  >
    <h2 className="text-xl font-medium text-[#f4f1ea]">
      Conversations
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
      Browse every completed conversation.
    </p>
  </Link>

  <Link
    href={`/harmonize/archive/${params.systemId}/memory`}
    className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-[#c6a96b]/50"
  >
    <h2 className="text-xl font-medium text-[#f4f1ea]">
      Relationship Memory
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
      What has become visible across completed conversations.
    </p>
  </Link>

  <Link
    href={`/harmonize/archive/${params.systemId}/timeline`}
    className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-[#c6a96b]/50"
  >
    <h2 className="text-xl font-medium text-[#f4f1ea]">
      Timeline
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
      View the relationship across time.
    </p>
  </Link>

  <Link
    href={`/harmonize/archive/${params.systemId}/exports`}
    className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-[#c6a96b]/50"
  >
    <h2 className="text-xl font-medium text-[#f4f1ea]">
      Exports
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
      Download reports when you choose.
    </p>
  </Link>
</div>
        </section>
      </main>
    </>
  )
}