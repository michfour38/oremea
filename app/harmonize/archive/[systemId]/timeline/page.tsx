"use client"

import MemberNav from "@/app/(member)/member-nav"
import Link from "next/link"
import { useEffect, useState, use } from "react";

export default function TimelinePage(
  props: {
    params: Promise<{ systemId: string }>
  }
) {
  const params = use(props.params);
  const [system, setSystem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTimeline() {
      try {
        const response = await fetch(
          `/api/harmonize/system/summary?systemId=${params.systemId}`,
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load timeline")
        }

        setSystem(data.system)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading the timeline.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadTimeline()
  }, [params.systemId])

  const conversations =
  system?.cycles?.filter(
    (cycle: any) => cycle.status === "archived",
  ) ?? []

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
            Timeline
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            The journey of this Relationship Space through time.
          </p>

          {loading ? (
            <p className="mt-8 text-sm text-[#bfb8aa]">
              Loading timeline...
            </p>
          ) : null}

          {error ? (
            <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {!loading && !error && conversations.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm leading-6 text-[#bfb8aa]">
                The timeline will begin when the first conversation is started.
              </p>
            </div>
          ) : null}

          {!loading && !error && conversations.length > 0 ? (
            <div className="mt-10 space-y-6 border-l border-[#c6a96b]/30 pl-6">
              {conversations.map((cycle: any, index: number) => (
                <div key={cycle.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-[#c6a96b]" />

                  <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
                    Conversation {index + 1}
                  </p>

                  <h2 className="mt-2 text-lg font-medium text-[#f4f1ea]">
                    {cycle.displayTitle || "Untitled Conversation"}
                  </h2>

                  <p className="mt-2 text-sm text-[#bfb8aa]">
                    {cycle.started_at
                      ? new Date(cycle.started_at).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </>
  )
}