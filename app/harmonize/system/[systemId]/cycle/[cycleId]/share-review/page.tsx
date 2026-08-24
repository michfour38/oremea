import Link from "next/link"

export default async function HarmonizeShareReviewPage(
  props: {
    params: Promise<{ systemId: string; cycleId: string }>
  }
) {
  const params = await props.params;
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Share Review
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Pause before sharing.
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Harmonize detected language that may need review before shared repair
          continues. This is not punishment. It is containment.
        </p>

        <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
          <p className="text-xl leading-8 text-[#f4f1ea]">
            Shared repair works best when pain is expressed without exposing
            private information or degrading another person.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
            className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Return and edit
          </Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            Move to private reflection
          </Link>
        </div>
      </section>
    </main>
  )
}