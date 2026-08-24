"use client";
import { use } from "react";

import MemberNav from "@/app/(member)/member-nav"
import Link from "next/link"

export default function ExportsPage(
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
            href={`/harmonize/archive/${params.systemId}`}
            className="text-sm text-[#c6a96b]"
          >
            ← Back to Archive
          </Link>

          <p className="mt-10 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
            Harmonize by Oremea
          </p>

          <h1 className="mt-4 text-4xl font-semibold">
            Exports
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            Download and preserve information from this Relationship Space
            when you choose.
          </p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              Coming soon
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
              Conversation summaries, relationship reports, timelines and
              participant-approved exports will appear here.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}