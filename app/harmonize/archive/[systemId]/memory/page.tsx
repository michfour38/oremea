"use client"

import MemberNav from "@/app/(member)/member-nav"
import Link from "next/link"
import { useEffect, useState, use } from "react";

export default function MemoryPage(
  props: {
    params: Promise<{ systemId: string }>
  }
) {
  const params = use(props.params);
  const [system, setSystem] = useState<any>(null)
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
          throw new Error(data.error || "Unable to load memory")
        }

        setSystem(data.system)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading memory.",
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
            href={`/harmonize/archive/${params.systemId}`}
            className="text-sm text-[#c6a96b]"
          >
            ← Back to Archive
          </Link>

          <p className="mt-10 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
            Harmonize by Oremea
          </p>

          <h1 className="mt-4 text-4xl font-semibold">
            Memory
          </h1>

          {system?.name ? (
            <p className="mt-3 text-sm text-[#bfb8aa]">
              {system.name}
            </p>
          ) : null}

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            What has become visible across completed conversations in this
            Relationship Space.
          </p>

          {loading ? (
            <p className="mt-8 text-sm text-[#bfb8aa]">
              Loading memory...
            </p>
          ) : null}

          {error ? (
            <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {!loading && !error ? (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-medium text-[#f4f1ea]">
                Nothing has been carried forward yet
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#bfb8aa]">
                Memory will hold only what participants intentionally allow to
                remain available beyond a completed conversation.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </>
  )
}