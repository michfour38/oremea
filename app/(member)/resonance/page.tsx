import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentDayContent } from "@/src/lib/resonance/getCurrentDayContent";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";
import {
  getRunContinuedDays,
  getRunMirror,
  getRunPromptCompletions,
} from "@/src/lib/resonance/resonance-run-data";
import PromptCard from "./prompt-card";
import MirrorCard from "./mirror-card";
import MemberNav from "../member-nav";
import MirrorOutput from "../mirror/mirror-output";
import AutoScrollToMirror from "./auto-scroll-to-mirror";

export const dynamic = "force-dynamic";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

async function getSignedInEmail() {
  const user = await currentUser();

  const primaryEmail =
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return normalizeEmail(primaryEmail);
}

function getResonanceBackgrounds(weekNumber?: number) {
  const desktopMap: Record<number, string> = {
    1: "/images/desktop/bg-hearth.webp",
    2: "/images/desktop/bg-mirror.webp",
    3: "/images/desktop/bg-garden.webp",
    4: "/images/desktop/bg-compass.webp",
    5: "/images/desktop/bg-pulse.webp",
    6: "/images/desktop/bg-shadow.webp",
    7: "/images/desktop/bg-forge.webp",
    8: "/images/desktop/bg-vision.webp",
    9: "/images/desktop/bg-the-gathering.webp",
    10: "/images/desktop/bg-the-becoming.webp",
  };

  const mobileMap: Record<number, string> = {
    1: "/images/mobile/bg-hearth.webp",
    2: "/images/mobile/bg-mirror.webp",
    3: "/images/mobile/bg-garden.webp",
    4: "/images/mobile/bg-compass.webp",
    5: "/images/mobile/bg-pulse.webp",
    6: "/images/mobile/bg-shadow.webp",
    7: "/images/mobile/bg-forge.webp",
    8: "/images/mobile/bg-vision.webp",
    9: "/images/mobile/bg-the-gathering.webp",
    10: "/images/mobile/bg-the-becoming.webp",
  };

  const key = weekNumber ?? 1;

  return {
    desktop: desktopMap[key] ?? desktopMap[1],
    mobile: mobileMap[key] ?? mobileMap[1],
  };
}

async function getActiveResonancePosition(runId: string, activeWeek: number) {
  const week = await prisma.resonance_weeks.findUnique({
    where: { week_number: activeWeek },
    include: {
      resonance_days: {
        orderBy: { day_number: "asc" },
        include: {
          day_prompts: {
            where: { is_published: true },
            orderBy: { prompt_order: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!week?.is_published) {
    throw new Error("The active Resonance week is not available.");
  }

  const promptIds = week.resonance_days.flatMap((day) =>
    day.day_prompts.map((prompt) => prompt.id),
  );

  const [completionByPrompt, continuedDayNumbers] = await Promise.all([
    getRunPromptCompletions(runId, promptIds),
    getRunContinuedDays(runId),
  ]);

  for (const day of week.resonance_days) {
    const prompts = day.day_prompts;
    if (prompts.length === 0) continue;

    const allPromptsDone = prompts.every((prompt) =>
      completionByPrompt.has(prompt.id),
    );

    const allDone =
      allPromptsDone && continuedDayNumbers.has(day.day_number);

    if (!allDone) {
      return {
        phase: activeWeek >= 9 ? ("INTEGRATION" as const) : ("CORE" as const),
        weekNumber: activeWeek,
        dayNumber: day.day_number,
      };
    }
  }

  return {
    phase: activeWeek >= 9 ? ("INTEGRATION" as const) : ("CORE" as const),
    weekNumber: activeWeek,
    dayNumber: 7,
  };
}

export default async function ResonancePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const signedInEmail = await getSignedInEmail();

  if (!signedInEmail) {
    redirect("/sign-in?redirect_url=%2Fresonance");
  }

  const resonanceAccess = await prisma.entry_leads.findUnique({
    where: { email: signedInEmail },
    select: {
      resonance_access_granted: true,
      entry_access_expires_at: true,
    },
  });

  const hasEntryAccess =
    resonanceAccess?.entry_access_expires_at &&
    resonanceAccess.entry_access_expires_at.getTime() > Date.now();

  const hasResonanceAccess =
    Boolean(resonanceAccess?.resonance_access_granted) || Boolean(hasEntryAccess);

  if (!hasResonanceAccess) {
    redirect("/oremea/enter");
  }

  const activeRun = await getActiveResonanceRun(userId);

  if (!activeRun) {
    redirect("/entry");
  }

  const progression = await getActiveResonancePosition(
    activeRun.id,
    activeRun.weekNumber,
  );

  let content: Awaited<ReturnType<typeof getCurrentDayContent>> | null = null;
  let contentLoadFailed = false;

  const resonancePhase =
    progression.phase === "INTEGRATION" ? "INTEGRATION" : "CORE";

  try {
    content = await getCurrentDayContent({
      phase: resonancePhase,
      weekNumber: progression.weekNumber,
      dayNumber: progression.dayNumber,
      userId,
      runId: activeRun.id,
    });
  } catch (error) {
    contentLoadFailed = true;
    console.error("Resonance content failed to load:", error);
  }

  const backgrounds = getResonanceBackgrounds(
    content?.weekNumber ?? progression.weekNumber,
  );

  const reflectionsCompleted = Boolean(
    content &&
      content.prompts.length > 0 &&
      content.prompts.every((prompt) => prompt.isCompleted),
  );

  const foundMirror =
    content?.dayNumber === 7 ? await getRunMirror(activeRun.id, 7) : null;

  const currentMirror =
    foundMirror?.tier === "full"
      ? {
          id: foundMirror.id,
          userId: foundMirror.userId,
          weekNumber: foundMirror.weekNumber,
          dayNumber: foundMirror.dayNumber,
          tier: "full" as const,
          output: foundMirror.output,
          createdAt: foundMirror.createdAt.toISOString(),
        }
      : null;

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${backgrounds.mobile})` }}
      />

      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: `url(${backgrounds.desktop})` }}
      />

      <div className="fixed inset-0 z-10 bg-black/55" />

      <div className="relative z-20 min-h-screen">
        <MemberNav />

        <div className="px-6 py-6">
          <div className="mx-auto max-w-2xl">
            <header className="space-y-3">
              {content ? (
                <>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Week {content.weekNumber} · Run {activeRun.runNumber} · Day {content.dayNumber}
                  </p>
                  <h1 className="text-4xl text-white">{content.weekTitle}</h1>
                  <p className="text-zinc-300">Resonance by Oremea</p>
                  <p className="text-zinc-400">{content.weekTheme}</p>
                </>
              ) : (
                <div className="space-y-3">
                  <h1 className="text-4xl text-white">Resonance</h1>
                  <p className="text-zinc-400">
                    {contentLoadFailed
                      ? "This day's reflections could not be loaded yet."
                      : "This day's reflections are not available yet."}
                  </p>
                </div>
              )}
            </header>

            {content ? (
              <>
                <div className="mt-10 space-y-6">
                  {content.prompts.map((prompt) => {
                    if (prompt.type === "mirror_exercise") {
                      return (
                        <MirrorCard
                          key={prompt.id}
                          prompt={prompt}
                          progressRatio={0.2}
                        />
                      );
                    }

                    return <PromptCard key={prompt.id} prompt={prompt} />;
                  })}
                </div>

                <AutoScrollToMirror trigger={reflectionsCompleted} />

                <div id="mirror" className="mt-10 scroll-mt-24">
                  <MirrorOutput
                    weekNumber={content.weekNumber}
                    dayNumber={content.dayNumber}
                    mirror={currentMirror}
                    reflectionsCompleted={reflectionsCompleted}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
