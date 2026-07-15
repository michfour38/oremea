import Link from "next/link"

export default function HarmonizeUpgradePage() {
  return (
    <main
      className="min-h-screen text-[#f4f1ea]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.74), rgba(0,0,0,0.74)), url('/images/harmonize/bg-harmonize-entry.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href="/harmonize"
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to Relationship Spaces
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Create another Relationship Space
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Your current plan includes one Relationship Space owned by you.
          Spaces another person invites you into do not count toward this limit.
        </p>

        <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
          <h2 className="text-lg font-medium text-[#f4f1ea]">
            Add another owned space
          </h2>

          <div className="mt-5 space-y-3 text-sm leading-6 text-[#d8d2c6]">
            <p>
              Each paid Relationship Space has its own participants,
              conversations, archive, and relationship memory.
            </p>

            <p>
              The price depends on the relationship type and included
              participant capacity.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-[#f4f1ea]">
                Couple or Parallel Parenting
              </p>

              <p className="mt-3 text-sm text-[#bfb8aa]">
                Up to 2 participants
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-[#f4f1ea]">
                Family Adults
              </p>

              <p className="mt-3 text-sm text-[#bfb8aa]">
                Up to 8 participants
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-[#f4f1ea]">
                Team
              </p>

              <p className="mt-3 text-sm text-[#bfb8aa]">
                Up to 25 participants
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-[#bfb8aa]">
            Payment activation is not connected yet.
          </p>
        </div>
      </section>
    </main>
  )
}