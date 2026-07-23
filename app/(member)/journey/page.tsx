import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDayContent } from "@/src/lib/journey/getCurrentDayContent";
import { getPromptThread, PromptThreadDTO } from "./journey.service";
import PromptCard from "./prompt-card";
import MirrorCard from "./mirror-card";
import { getMemberWaveContext } from "@/src/lib/wave/wave.service";
import { getWaveNameVoteCounts } from "@/src/lib/wave/wave-name-vote.service";
import MemberNav from "../member-nav";
import { getMirrorAccess } from "@/app/(member)/mirror/mirror-access";
import MirrorOutput from "../mirror/mirror-output";
import { getMirrorHistory } from "../mirror/mirror.service";
import { continueJourneyDayAction } from "./actions";
import ContinueDayButton from "./continue-day-button";
import AutoScrollToMirror from "./auto-scroll-to-mirror";

export const dynamic = "force-dynamic";

const PAYSTACK_CURRENT_URL = "https://paystack.shop/pay/ey9b56zykb";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

async function getSignedInEmail() {
  const user = await currentUser();

  const primaryEmail =
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return normalizeEmail(primaryEmail);
}

function getJourneyBackgrounds(weekNumber?: number) {
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

function getWinningWaveName(
  waveNameCounts: Map<string, number>,
  fallbackWaveName: string
) {
  const sorted = Array.from(waveNameCounts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? fallbackWaveName;
}

function isJourneyMirrorUpsellEligible(weekNumber: number, dayNumber: number) {
  return weekNumber > 1 || dayNumber >= 2;
}

// 🔒🔒🔒 TESTING DAY LOCK — REMOVE BEFORE PRODUCTION 🔒🔒🔒
function getTestingJourneyOverride() {
  const enabled = false;

  if (!enabled) return null;

  return {
    phase: "INTEGRATION" as const,
    weekNumber: 10,
    dayNumber: 7,
  };
}

async function getSelfPacedJourneyPosition(userId: string) {
  const weeks = await prisma.journey_weeks.findMany({
    where: { is_published: true },
    orderBy: { week_number: "asc" },
    include: {
      journey_days: {
        orderBy: { day_number: "asc" },
        include: {
          day_prompts: {
            where: { is_published: true },
            orderBy: { prompt_order: "asc" },
            include: {
              prompt_completions: {
                where: { user_id: userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  for (const week of weeks) {
    for (const day of week.journey_days) {
      const prompts = day.day_prompts;

      if (prompts.length === 0) continue;

const allPromptsDone = prompts.every(
  (prompt) => prompt.prompt_completions.length > 0
);

const continued = await prisma.journey_day_continues.findUnique({
  where: {
    user_id_week_number_day_number: {
      user_id: userId,
      week_number: week.week_number,
      day_number: day.day_number,
    },
  },
  select: { id: true },
});

const allDone = allPromptsDone && Boolean(continued);

      if (!allDone) {
        return {
          phase: week.week_number >= 9 ? "INTEGRATION" as const : "CORE" as const,
          weekNumber: week.week_number,
          dayNumber: day.day_number,
          completed: false,
        };
      }
    }
  }

  return {
    phase: "COMPLETED" as const,
    weekNumber: 10,
    dayNumber: 7,
    completed: true,
  };
}

export default async function JourneyPage({
  searchParams,
}: {
  searchParams?: {
    mirror?: string;
  };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

const signedInEmail = await getSignedInEmail();

if (!signedInEmail) {
  redirect("/sign-in?redirect_url=%2Fresonance");
}

const shouldActivateMirror =
  typeof searchParams?.mirror === "string" &&
  searchParams.mirror === "generate";

if (shouldActivateMirror) {
  await prisma.entry_leads.updateMany({
    where: { email: signedInEmail },
    data: {
      pathway: "relate",
      journey_access_granted: true,
      journey_paid_at: new Date(),
    },
  });
}

// 👇 ADD THIS BLOCK RIGHT HERE
const entryLead = await prisma.entry_leads.findUnique({
  where: { email: signedInEmail },
  select: {
    pathway: true,
  },
});

const pathway =
  entryLead?.pathway === "relate" ? "relate" : "discover";

await prisma.profiles.upsert({
  where: { id: userId },
  update: {
    pathway,
    updated_at: new Date(),
  },
  create: {
    id: userId,
    display_name: signedInEmail.split("@")[0],
    pathway,
    journey_status: "active",
    updated_at: new Date(),
  },
});
  const journeyAccess = await prisma.entry_leads.findUnique({
  where: { email: signedInEmail },
  select: {
    journey_access_granted: true,
    entry_access_expires_at: true,
  },
});

const hasEntryAccess =
  journeyAccess?.entry_access_expires_at &&
  journeyAccess.entry_access_expires_at.getTime() > Date.now();

const hasJourneyAccess =
  Boolean(journeyAccess?.journey_access_granted) || Boolean(hasEntryAccess);

if (!hasJourneyAccess) {
  redirect("/oremea/enter");
}

  let displayWaveName = "Your Wave";
  let waveContext: Awaited<ReturnType<typeof getMemberWaveContext>> | null = null;

  try {
    waveContext = await getMemberWaveContext(userId);

    if (waveContext?.wave?.id) {
      const waveNameCounts = await getWaveNameVoteCounts(waveContext.wave.id);

      displayWaveName = getWinningWaveName(
        waveNameCounts,
        waveContext.wave.name
      );
    }
  } catch (error) {
    console.error("Wave context failed:", error);
  }

  if (!waveContext) {
    return (
      <main className="relative min-h-screen overflow-x-hidden text-white">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: "url(/images/mobile/bg-hearth.webp)" }}
        />

        <div
          className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat md:block"
          style={{ backgroundImage: "url(/images/desktop/bg-hearth.webp)" }}
        />

        <div className="fixed inset-0 z-10 bg-black/55" />

        <div className="relative z-20 min-h-screen">
          <MemberNav />

          <div className="px-6 py-6">
            <div className="mx-auto max-w-2xl">
              <header className="space-y-3">
                <h1 className="text-4xl text-white">Journey Active</h1>
                <p className="text-zinc-300">Resonance by Oremea - Journey</p>
                <p className="text-zinc-400">
                  Journey content could not be loaded yet.
                </p>
              </header>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const testingOverride = getTestingJourneyOverride();

  console.log("TEST LOCK ACTIVE", testingOverride);

  const selfPacedPosition = await getSelfPacedJourneyPosition(userId);

const progression = testingOverride
  ? {
      ...waveContext.progression,
      phase: testingOverride.phase,
      weekNumber: testingOverride.weekNumber,
      dayNumber: testingOverride.dayNumber,
    }
  : selfPacedPosition;

  if (progression.phase === "COMPLETED") {
    const backgrounds = getJourneyBackgrounds(10);

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
                <h1 className="text-4xl text-white">Journey Complete</h1>
                <p className="text-zinc-300">Resonance by Oremea - Journey</p>
                <p className="text-zinc-400">
                  Your 10-week Resonance journey has completed.
                </p>
              </header>
            </div>
          </div>
        </div>
      </main>
    );
  }

  let content: Awaited<ReturnType<typeof getCurrentDayContent>> | null = null;
  let contentLoadFailed = false;

  const journeyPhase =
    progression.phase === "INTEGRATION" ? "INTEGRATION" : "CORE";

  try {
    content = await getCurrentDayContent({
      phase: journeyPhase,
      weekNumber: progression.weekNumber!,
      dayNumber: progression.dayNumber!,
      userId,
    });
  } catch (error) {
    contentLoadFailed = true;
    console.error("Journey content failed to load:", error);
  }

  const backgrounds = getJourneyBackgrounds(
    content?.weekNumber ?? progression.weekNumber ?? 1
  );

  let liteMirrorEligible = false;
  let fullMirrorEligible = false;
  let liteMirrorUnlocked = false;
  let fullMirrorUnlocked = false;
  let currentMirror: Awaited<ReturnType<typeof getMirrorHistory>>[number] | null =
    null;
  let mirrorExerciseCompleted = false;
  const threadMap = new Map<string, PromptThreadDTO | null>();

    if (content) {
    try {
      mirrorExerciseCompleted =
        content.prompts.length > 0 &&
        content.prompts.every((prompt) => prompt.isCompleted);

      await Promise.all(
        content.prompts
          .filter(
            (prompt) => prompt.type === "thread_prompt" && prompt.isCompleted
          )
          .map(async (prompt) => {
            const thread = await getPromptThread(prompt.id, userId);
            threadMap.set(prompt.id, thread);
          })
      );

const mirrorAccess = await getMirrorAccess(signedInEmail);

liteMirrorEligible = false;

fullMirrorEligible = mirrorAccess.has2QOnly;

liteMirrorUnlocked = false;

fullMirrorUnlocked = mirrorAccess.hasFullMirror;
      const foundMirror = await prisma.mirror_responses.findFirst({
  where: {
    user_id: userId,
    week_number: content.weekNumber,
    day_number: content.dayNumber,
    tier: "full",
  },
  orderBy: {
    created_at: "desc",
  },
});

currentMirror =
  mirrorAccess.hasFullMirror && foundMirror
    ? {
  id: foundMirror.id,
  userId: foundMirror.user_id,
  weekNumber: foundMirror.week_number,
  dayNumber: foundMirror.day_number,
  tier: foundMirror.tier as "full" | "lite",
  output: foundMirror.output,
  createdAt: foundMirror.created_at.toISOString(),
}
    : null;
    } catch (error) {
      console.error("Mirror state failed:", error);
    }
  }

  const showCurrentUnlockCard = Boolean(
    content &&
      content.weekNumber === 10 &&
      content.dayNumber === 7 &&
      mirrorExerciseCompleted &&
      currentMirror
  );

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
  <h1 className="text-4xl text-white">{content.weekTitle}</h1>

  <p className="text-zinc-300">
    Resonance by Oremea - Journey
  </p>

  <p className="text-zinc-400">{content.weekTheme}</p>
</>
              ) : (
                <div className="space-y-3">
                  <h1 className="text-4xl text-white">Journey Active</h1>
                  <p className="text-zinc-300">Resonance by Oremea - Journey</p>
                  <p className="text-zinc-400">
                    {contentLoadFailed
                      ? "Journey content could not be loaded yet."
                      : "Journey content is not available yet."}
                  </p>
                </div>
              )}
            </header>

            {content ? (
              <>
                <div className="mt-10 space-y-6">
                  {content.prompts.map((prompt, index) => {
                    if (prompt.type === "mirror_exercise") {
                      return (
                        <MirrorCard
                          key={prompt.id}
                          prompt={prompt}
                          progressRatio={0.2}
                        />
                      );
                    }

                    return (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        index={index}
                        thread={threadMap.get(prompt.id) ?? null}
                        currentPathway={waveContext?.membership.pathway ?? "discover"}
                      />
                    );
                  })}
                </div>

<AutoScrollToMirror
  trigger={content.prompts.every((prompt) => prompt.isCompleted)}
/>

<div id="mirror" className="mt-10 scroll-mt-24">
  <MirrorOutput
                    weekNumber={content.weekNumber}
                    dayNumber={content.dayNumber}
                    liteMirrorEligible={liteMirrorEligible}
                    fullMirrorEligible={fullMirrorEligible}
                    liteMirrorUnlocked={liteMirrorUnlocked}
                    fullMirrorUnlocked={fullMirrorUnlocked}
                    mirror={currentMirror}
                    mirrorExerciseCompleted={mirrorExerciseCompleted}
                  />
                </div>

{content.prompts.every((prompt) => prompt.isCompleted) &&
currentMirror ? (
  <form action={continueJourneyDayAction} className="mt-6 flex justify-end">
    <input type="hidden" name="weekNumber" value={content.weekNumber} />
    <input type="hidden" name="dayNumber" value={content.dayNumber} />

    <ContinueDayButton />

  </form>
) : null}

                {showCurrentUnlockCard ? (
                  <div className="mt-8 rounded-3xl border border-emerald-400/40 bg-emerald-400/10 p-6 md:p-8">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                      The Current
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      You’re ready for The Current.
                    </h2>

                    <p className="mt-4 text-base leading-8 text-zinc-100">
                      Over the course of this journey, something in you has
                      clarified.
                    </p>

                    <p className="mt-4 text-base leading-8 text-zinc-200">
                      Not everyone reaches this point with the same honesty,
                      steadiness, or willingness to be changed by what they’ve
                      seen.
                    </p>

                    <p className="mt-4 text-base leading-8 text-zinc-200">
                      What may be opening now is a quiet readiness to meet
                      others more deeply, from where you are now.
                    </p>

                    <p className="mt-4 text-base leading-8 text-zinc-200">
                      The Current is a space for people who have done the work —
                      and want to meet others who have done the same.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={PAYSTACK_CURRENT_URL}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-400/50 px-5 py-3 text-sm text-emerald-200 transition hover:bg-emerald-400/10"
                      >
                        Enter The Current — R900
                      </a>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}