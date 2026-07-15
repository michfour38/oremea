"use client"

import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useEffect, useState } from "react"

import { SiteShell } from "@/components/site/site-shell"

function modeLabel(mode?: string) {
  if (mode === "couple") return "Couple"
  if (mode === "family_adults") return "Family Adults"
  if (mode === "team") return "Team"
  if (mode === "parallel_parenting_adults") {
    return "Parallel Parenting Adults"
  }

  return "Harmonize"
}

function RelationshipSpaceCard({ system }: { system: any }) {
  return (
    <Link
      href={`/harmonize/system/${system.id}`}
      className="block rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-[#c6a96b]/60 hover:bg-[#c6a96b]/10"
    >
      <h3 className="text-lg font-medium text-[#f4f1ea]">
        {system.name || modeLabel(system.mode)}
      </h3>

      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8f8778]">
        {modeLabel(system.mode)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
            Participants
          </p>

          <p className="mt-1 text-2xl font-semibold text-[#f4f1ea]">
            {system.participants?.length || 0}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
            Conversations
          </p>

          <p className="mt-1 text-2xl font-semibold text-[#f4f1ea]">
            {system.cycles?.length || 0}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm text-[#bfb8aa]">
          Continue where you left off
        </span>

        <span className="shrink-0 text-sm font-medium text-[#c6a96b]">
          Open space →
        </span>
      </div>
    </Link>
  )
}

export default function HarmonizePage() {
  const { user, isLoaded } = useUser()

  const [systems, setSystems] = useState<any[]>([])
  const [loadingSystems, setLoadingSystems] = useState(true)

  useEffect(() => {
    async function loadSystems() {
      try {
        const response = await fetch("/api/harmonize/systems")
        const data = await response.json()

        if (response.ok && data.success) {
          setSystems(data.systems || [])
        }
      } catch {
        // Keep the page usable if the lookup fails.
      } finally {
        setLoadingSystems(false)
      }
    }

    loadSystems()
  }, [])

  const ownedSystems =
    isLoaded && user
      ? systems.filter(
          (system) =>
            system.owner_profile_id === user.id ||
            (!system.owner_profile_id && system.created_by === user.id),
        )
      : []

  const sharedSystems =
    isLoaded && user
      ? systems.filter(
          (system) =>
            system.owner_profile_id !== user.id &&
            system.created_by !== user.id,
        )
      : []

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
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-6">
          <img
            src="/images/harmonize/harmonize-hero.webp"
            alt="Harmonize"
            className="mx-auto mb-4 w-full max-w-[200px]"
          />

          <p className="mx-auto -mt-2 max-w-4xl whitespace-pre-line text-center text-base leading-7 text-[#d8d2c6] md:text-lg">
            {`Harmonize is a structured relational reflection space for couples, families, friendships, business partnerships,
and parallel parenting relationships who want to understand the pattern forming between them.`}
          </p>

          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              Your Relationship Spaces
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
              You pay only for relationship spaces you create. Spaces another
              person invites you into remain available under their ownership.
            </p>

            {loadingSystems || !isLoaded ? (
              <p className="mt-6 text-sm text-[#bfb8aa]">
                Checking for relationship spaces...
              </p>
            ) : null}

            {!loadingSystems && isLoaded && !systems.length ? (
              <p className="mt-6 text-sm leading-6 text-[#bfb8aa]">
                No relationship spaces yet.
              </p>
            ) : null}

            {!loadingSystems && isLoaded && ownedSystems.length ? (
              <div className="mt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium text-[#f4f1ea]">
                      Owned by you
                    </h3>

                    <p className="mt-1 text-sm text-[#8f8778]">
                      {ownedSystems.length} relationship{" "}
                      {ownedSystems.length === 1 ? "space" : "spaces"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {ownedSystems.map((system) => (
                    <RelationshipSpaceCard
                      key={system.id}
                      system={system}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {!loadingSystems && isLoaded && sharedSystems.length ? (
              <div className="mt-10 border-t border-white/10 pt-8">
                <div>
                  <h3 className="text-base font-medium text-[#f4f1ea]">
                    Shared with you
                  </h3>

                  <p className="mt-1 text-sm text-[#8f8778]">
                    These spaces were created and paid for by another
                    participant.
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {sharedSystems.map((system) => (
                    <RelationshipSpaceCard
                      key={system.id}
                      system={system}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-sm text-[#bfb8aa]">
                You currently own {ownedSystems.length} relationship{" "}
                {ownedSystems.length === 1 ? "space" : "spaces"}.
              </p>

              <Link
  href={ownedSystems.length >= 1 ? "/harmonize/upgrade" : "/harmonize/start"}
  className="mt-4 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
>
  {ownedSystems.length >= 1
    ? "Upgrade to create another space"
    : "+ Create Relationship Space"}
</Link>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}