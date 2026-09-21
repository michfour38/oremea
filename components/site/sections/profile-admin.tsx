import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { isOremeaAdmin } from "@/lib/auth/admin-access";

export async function ProfileAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  if (!(await isOremeaAdmin(userId))) return null;

  const newFeedback = await prisma.oremea_feedback_messages.count({
    where: { status: "new" },
  });

  return (
    <section className="border-b border-white/5 bg-black/25">
      <div className="mx-auto max-w-6xl px-5 py-7 md:py-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#b79a63]/25 bg-[#b79a63]/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
              Admin
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Oremea business tools
              {newFeedback > 0 ? ` · ${newFeedback} new feedback` : ""}.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex rounded-full border border-[#b79a63]/45 bg-[#b79a63]/10 px-5 py-3 text-sm text-[#e2c78e] transition hover:border-[#b79a63]/75"
          >
            Open admin
          </Link>
        </div>
      </div>
    </section>
  );
}
