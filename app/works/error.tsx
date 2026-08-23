"use client";

import Link from "next/link";

export default function WorksError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-[70vh] bg-[#f3eee4] px-5 py-16 text-[#1f1c17] md:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white/70 p-7 md:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8b6a31]">WORKS paused here</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">This part of WORKS could not open.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">
          Your saved search has not been removed. Try the request again, or return to WORKS and continue from there.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">
            Try again
          </button>
          <Link href="/works" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">
            Return to WORKS
          </Link>
          <a href="https://www.oremea.com/contact#contact-form" className="px-2 py-3 text-sm underline underline-offset-4">
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
