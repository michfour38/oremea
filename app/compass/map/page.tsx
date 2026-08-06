import Link from "next/link";

import MemberNav from "@/app/(member)/member-nav";
import { CompassMapWorkspace } from "./CompassMapWorkspace";

export default function CompassMapPage() {
  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <MemberNav />

      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <Link
          href="/compass"
          className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-[#d8b15f]"
        >
          ← Return to Compass
        </Link>

        <header className="mt-8 border-b border-zinc-800/80 pb-7">
          <p className="text-xs uppercase tracking-[0.32em] text-[#d8b15f]">
            Compass Map
          </p>
          <h1 className="mt-4 text-4xl font-light text-white md:text-6xl">
            What is asking for attention
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Keep the active field clear. Completed goals remain available and
            can return whenever they become current again.
          </p>
        </header>

        <CompassMapWorkspace />
      </section>
    </main>
  );
}
