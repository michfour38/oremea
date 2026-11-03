import { logPrivateError } from "@/src/lib/security/private-errors";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentDayContent } from "@/src/lib/resonance/getCurrentDayContent";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";
import { getActivePartnerBrand } from "@/src/lib/oremea/partner-brand-context";
import { getResonanceSceneBackgrounds } from "@/src/lib/resonance/resonance-backgrounds";
import {
  getRunActiveDay,
  getRunMirror,
} from "@/src/lib/resonance/resonance-run-data";
import PromptCard from "./prompt-card";
import MirrorCard from "./mirror-card";
import MemberNav from "../member-nav";
import MirrorOutput from "../mirror/mirror-output";
import AutoScrollToMirror from "./auto-scroll-to-mirror";
import ResonanceInputFocus from "./resonance-input-focus";

export const dynamic = "force-dynamic";

async function getActiveResonancePosition(runId: string, activeWeek: number) {
  const dayNumber = await getRunActiveDay(runId, activeWeek);

  if (!dayNumber) {
    throw new Error("The active Resonance room is not available.");
  }

  return {
    phase: activeWeek >= 9 ? ("INTEGRATION" as const) : ("CORE" as const),
    weekNumber: activeWeek,
    dayNumber,
  };
}

export default async function ResonancePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // A verified purchase creates the active run. The run itself is the access
  // authority; the retired entry_leads blanket-access flag no longer gates use.
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
    logPrivateError("Resonance content failed to load:", error);
  }

  const activePartner = await getActivePartnerBrand(userId, "resonance");
  const backgrounds = getResonanceSceneBackgrounds(
    content?.weekNumber ?? progression.weekNumber,
    activePartner?.brand ?? null,
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
    <main
      data-resonance-root="true"
      className="resonance-theme relative min-h-screen overflow-x-hidden"
      style={{ caretColor: "var(--product-accent)" }}
    >
      <ResonanceInputFocus />

      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: backgrounds.mobile ? `url(${backgrounds.mobile})` : "none" }}
      />

      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: backgrounds.desktop ? `url(${backgrounds.desktop})` : "none" }}
      />

      <div className="res-photo-overlay fixed inset-0 z-10" />

      <div className="relative z-20 min-h-screen">
        <MemberNav />

        <div className="px-6 py-6">
          <div className="mx-auto max-w-2xl">
            <header className="space-y-3">
              {content ? (
                <>
                  <p className="res-accent text-xs uppercase tracking-[0.22em]">
                    Resonance · Day {content.dayNumber}
                  </p>
                  <h1 className="res-text text-4xl">{content.weekTitle}</h1>
                  <p className="res-text-secondary">
                    {content.weekTheme.replace(/\.\s*$/, "")}
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <h1 className="res-text text-4xl">Resonance</h1>
                  <p className="res-text-secondary">
                    {contentLoadFailed
                      ? "This day's reflections could not be loaded yet"
                      : "This day's reflections are not available yet"}
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
                    key={`${content.weekNumber}-${content.dayNumber}`}
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
