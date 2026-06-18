"use client"

import { SiteShell } from "@/components/site/site-shell"
import Link from "next/link"
import { useEffect, useState } from "react"

const modes = [
  {
    key: "couple",
    title: "Couple",
    description: "For two adults navigating a relationship pattern together.",
  },
  {
    key: "family_adults",
    title: "Family Adults",
    description: "For adult family members navigating recurring family dynamics.",
  },
  {
    key: "team",
    title: "Team",
    description: "For teams navigating communication, trust, responsibility, and repair.",
  },
  {
    key: "parallel_parenting_adults",
    title: "Parallel Parenting Adults",
    description:
      "For separated parents who need structure, boundaries, and child-centered coordination without forced emotional exposure.",
  },
]

export default function HarmonizePage() {
  const [existingSystem, setExistingSystem] = useState<any>(null)
  const [loadingSystem, setLoadingSystem] = useState(true)
const forceNew = typeof window !== "undefined"
  ? new URLSearchParams(window.location.search).get("new") === "1"
  : false

  useEffect(() => {
    async function loadExistingSystem() {
      try {
        const response = await fetch("/api/harmonize/systems")
        const data = await response.json()

        if (!forceNew && response.ok && data.success && data.systems?.length) {
  setExistingSystem(data.systems[0])
}
      } catch {
        // If resume check fails, still allow page to render.
      } finally {
        setLoadingSystem(false)
      }
    }

    loadExistingSystem()
  }, [])

  return (
    <SiteShell>
      <main
        className="min-h-screen text-[#f4f1ea]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.70), rgba(0,0,0,0.70)), url('/images/harmonize/bg-harmonize-entry.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <section className="mx-auto max-w-5xl px-6 pt-6 pb-20">
          <img
            src="/images/harmonize/harmonize-hero.webp"
            alt="Harmonize"
            className="mx-auto mb-4 w-full max-w-[200px]"
          />

          <p className="mx-auto -mt-2 max-w-4xl whitespace-pre-line text-center text-base leading-7 text-[#d8d2c6] md:text-lg">
            {`Harmonize is a structured relational reflection space for couples, families, friendships, business partnerships,
and parallel parenting relationships who want to understand the pattern forming between them.`}
          </p>

          {loadingSystem ? (
            <p className="mt-8 text-center text-sm text-[#bfb8aa]">
              Checking for your Harmonize container...
            </p>
          ) : existingSystem ? (
            <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6 text-center">
              <h2 className="text-lg font-medium text-[#f4f1ea]">
                Your Harmonize container is ready.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
                One Harmonize container is connected to your account. Resume
                from where you left off.
              </p>

              <Link
                href={`/harmonize/system/${existingSystem.id}`}
                className="mt-6 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                Resume container
              </Link>
            </div>
          ) : (
            <div className="mx-auto mt-6 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">

<div className="mb-6 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
  <h2 className="text-lg font-medium text-[#f4f1ea]">
    Harmonize Pricing
  </h2>

  <div className="mt-4 space-y-3 text-sm leading-6 text-[#d8d2c6]">
    <p>
      Harmonize includes <strong>2 participants</strong> at
      <strong> R1200/month</strong>.
    </p>

    <p>
      Additional participants are
      <strong> R300/month</strong> each.
    </p>

    <p>
      Self-serve containers support up to
      <strong> 10 participants</strong>.
    </p>

    <p>
      Larger groups, organizations, schools, communities, and extended
      family systems can request a custom setup.
    </p>
  </div>
</div>

              <h2 className="text-lg font-medium text-[#f4f1ea]">
                Choose your container type
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {modes.map((mode) => (
                  <Link
                    key={mode.key}
                    href={`/harmonize/start?mode=${mode.key}`}
                    className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-[#c6a96b]/60 hover:bg-[#c6a96b]/10"
                  >
                    <h3 className="text-lg font-medium text-[#f4f1ea]">
                      {mode.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
                      {mode.description}
                    </p>
                    <p className="mt-4 text-sm text-[#c6a96b]">Begin →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  )
}