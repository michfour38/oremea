import Link from "next/link"
import { redirect } from "next/navigation"

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

export default function HarmonizeStartPage({
  searchParams,
}: {
  searchParams: { mode?: string }
}) {
  const mode = searchParams.mode

  if (!mode || !allowedModes.includes(mode as any)) {
    redirect("/harmonize")
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
        <Link
          href="/harmonize"
          className="mb-8 text-sm text-[#c6a96b] hover:underline"
        >
          ← Back to Harmonize
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {modeLabels[mode]}
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Before a system is created, every participant needs their own account.
          Private reflections remain private. Shared repair is chosen, not
          extracted.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-medium">What happens next</h2>

          <div className="mt-5 space-y-4 text-sm leading-6 text-[#bfb8aa]">
            <p>
              <span className="text-[#f4f1ea]">1. Create the system.</span>{" "}
              This becomes the private container for the relationship, family,
              team, or parallel parenting structure.
            </p>

            <p>
              <span className="text-[#f4f1ea]">2. Add adult participants.</span>{" "}
              Minor participation is hidden for now until the full safety,
              policy, and verification layer exists.
            </p>

            <p>
              <span className="text-[#f4f1ea]">3. Begin privately.</span>{" "}
              Each participant starts in private witness. Nothing is shared
              automatically.
            </p>

            <p>
              <span className="text-[#f4f1ea]">4. Enter shared repair only when ready.</span>{" "}
              Harmonize protects the process, not the outcome.
            </p>
          </div>
        </div>

        <Link
  href={`/harmonize/agreement?mode=${mode}`}
  className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
>
  Let's begin.
</Link>
      </section>
    </main>
  )
}