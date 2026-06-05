import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CompassArchiveWheel } from "./CompassArchiveWheel";

import { prisma } from "@/lib/prisma";
import MemberNav from "@/app/(member)/member-nav";

export default async function CompassArchivePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const sessions = await prisma.compass_sessions.findMany({
    where: {
  user_id: userId,
  status: {
    in: ["active", "complete"],
  },
},
    orderBy: {
      updated_at: "desc",
    },
    select: {
      id: true,
      selected_area: true,
      final_step: true,
      updated_at: true,
    },
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
      <MemberNav />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-5 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,177,95,0.12),transparent_38%),linear-gradient(180deg,rgba(9,9,9,0.4),rgba(9,9,9,1))]" />

        <div className="relative z-10 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-[#d8b15f]">
            Compass Archive
          </p>

          <h1 className="mt-5 text-4xl font-light text-white md:text-6xl">
            Your navigation history
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400">
            Return to the goals, decisions, and directions you have already moved through.
          </p>
        </div>

        <CompassArchiveWheel />

      </section>

    </main>
  );
}