import Link from "next/link";

export default function WorksNotFound() {
  return (
    <main className="min-h-[70vh] bg-[#f3eee4] px-5 py-16 text-[#1f1c17] md:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white/70 p-7 md:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8b6a31]">Not found</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">That WORKS page is not available.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">
          The link may have expired, the provider profile may no longer be public, or the address may be incomplete.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/works" className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">
            Start with WORKS
          </Link>
          <a href="https://www.oremea.com/contact#contact-form" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
