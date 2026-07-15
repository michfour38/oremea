"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const allowedModes = [
  "couple",
  "family_adults",
  "team",
  "parallel_parenting_adults",
] as const

const modeLabels: Record<string, string> = {
  couple: "Couple",
  family_adults: "Family Adults",
  team: "Team",
  parallel_parenting_adults: "Parallel Parenting Adults",
}

const modeCapacity: Record<string, string> = {
  couple: "2 participants included",
  family_adults: "8 participants included",
  team: "25 participants included",
  parallel_parenting_adults: "2 participants included",
}

const modeExamples: Record<string, string> = {
  couple: "Michelle & John",
  family_adults: "The Fouries",
  team: "Leadership Team",
  parallel_parenting_adults: "Parallel Parenting",
}

export default function HarmonizeCreatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get("mode")

  const [spaceName, setSpaceName] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingSystems, setLoadingSystems] = useState(true)
  const [existingSystem, setExistingSystem] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadExistingSystem() {
      try {
        const response = await fetch("/api/harmonize/systems")
        const data = await response.json()

        if (response.ok && data.success && data.systems?.length) {
          setExistingSystem(data.systems[0])
        }
      } catch {
      } finally {
        setLoadingSystems(false)
      }
    }

    loadExistingSystem()
  }, [])

  if (!mode || !allowedModes.includes(mode as any)) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-20 text-[#f4f1ea]">
        <div className="mx-auto max-w-2xl">
          <p>Invalid Harmonize mode.</p>
          <Link href="/harmonize" className="mt-4 inline-block text-[#c6a96b]">
            Return to Harmonize
          </Link>
        </div>
      </main>
    )
  }

  async function createSystem() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          name: spaceName,
          consentSnapshot: {
            acceptedAt: new Date().toISOString(),
            mode,
            agreementVersion: "harmonize-v1",
            principles: [
              "Private reflections remain private",
              "Shared repair is chosen not extracted",
              "Understanding is more important than agreement",
              "Repair is invitation not obligation",
              "Harmonize does not determine who is right",
              "Participants remain responsible for their own choices",
              "Minor participation is not available in this version",
            ],
            safetyAccepted: true,
          },
        }),
      })

      const data = await response.json()

      if (data.paymentRequired) {
  router.push("/harmonize/upgrade")
  return
}

if (!response.ok || !data.success) {
  throw new Error(data.error || "Unable to create relationship space")
}

      router.push(`/harmonize/system/${data.system.id}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating this relationship space.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen text-[#f4f1ea]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('/images/harmonize/bg-harmonize-entry.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Create your {modeLabels[mode]} relationship space
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          A relationship space brings the right people together around one
          relationship. Conversations, reflections, and patterns stay together
          inside that space.
        </p>

        {loadingSystems ? (
          <p className="mt-8 text-sm text-[#bfb8aa]">
            Checking for existing relationship spaces...
          </p>
        ) : null}

        {existingSystem ? (
          <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              Resume current relationship space
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
              You already have a Harmonize relationship space connected to this
              account.
            </p>

            <Link
              href={`/harmonize/system/${existingSystem.id}`}
              className="mt-5 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
            >
              Open relationship space
            </Link>
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-medium">
            Name this relationship space
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
            Optional. You can change this later.
          </p>

          <input
            value={spaceName}
            onChange={(event) => setSpaceName(event.target.value)}
            placeholder={modeExamples[mode]}
            className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
          />

          <div className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4">
            <p className="text-sm font-medium text-[#f4f1ea]">
              Included with this space
            </p>

            <p className="mt-2 text-sm text-[#d8d2c6]">
              {modeCapacity[mode]}
            </p>

            <p className="mt-1 text-sm text-[#d8d2c6]">
              Unlimited conversations
            </p>

            <p className="mt-1 text-sm text-[#d8d2c6]">
              Unlimited archives
            </p>
          </div>

          {error ? (
            <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={createSystem}
            disabled={loading}
            className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create relationship space"}
          </button>
        </div>
      </section>
    </main>
  )
}