import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import MemberNav from "@/app/(member)/member-nav";
import { CompassDailyGoals } from "./CompassDailyGoals";
import { CompassMapWorkspace } from "./CompassMapWorkspace";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

export default async function CompassMapPage() {
  const { userId } = await auth();

  if (!userId || !(await getCompassAccessState(userId)).active) {
    redirect("/");
  }

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
            Today holds the goals you choose for yourself. The Map below holds
            what your Compass conversations bring into view. Completed items
            remain available and can return whenever they become current again.
          </p>
        </header>

        <CompassDailyGoals />
        <CompassMapWorkspace />
      </section>
    </main>
  );
}
