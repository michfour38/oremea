"use client"

import MemberNav from "@/app/(member)/member-nav"
import Link from "next/link"
import { useEffect, useState, use } from "react";

export default function RelationshipMemoryPage(
  props: {
    params: Promise<{ systemId: string }>
  }
) {
  const params = use(props.params);
  const [system, setSystem] = useState<any>(null)
  const [memory, setMemory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadMemory() {
      try {
        const response = await fetch(
          `/api/harmonize/system/summary?systemId=${params.systemId}`,
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to load Relationship Memory",
          )
        }

        setSystem(data.system)
        setMemory(data.memory)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading Relationship Memory.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadMemory()
  }, [params.systemId])

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

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Relationship Memory
          </h1>

          {system ? (
            <p className="mt-3 text-sm text-[#bfb8aa]">
              {system.name || "Relationship Space"}
            </p>
          ) : null}

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            Relationship Memory holds what has become visible across completed
            conversations in this Relationship Space.
          </p>

          {loading ? (
            <p className="mt-8 text-sm text-[#bfb8aa]">
              Loading Relationship Memory...
            </p>
          ) : null}

          {error ? (
            <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {!loading && !error ? (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
                    Conversations
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {memory?.totalCycles || 0}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
                    Integrated
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {memory?.integrationCycles || 0}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
                    Repeating
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {memory?.repetitionCycles || 0}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
                    Words / behaviour gap
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {memory?.mimicryCycles || 0}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium">
                  What has become visible
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                  Detailed recurring themes, behaviours, recognitions, and
                  shifts will appear here as conversations are completed and
                  reviewed.
                </p>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </>
  )
}