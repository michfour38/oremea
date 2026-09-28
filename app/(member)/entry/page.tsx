import Link from "next/link";
import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getRunContinuedDays } from "@/src/lib/resonance/resonance-run-data";
import {
  getActiveResonanceRun,
  getResonanceWeekRuns,
} from "@/src/lib/resonance/resonance-week-run";
import MemberNav from "../member-nav";
import { getVisitBalance } from "@/src/lib/resonance/visit-orders";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
import { enterVisitRoom } from "../resonance/visits/actions";
import { VisitSubmitButton } from "../resonance/visits/submit-button";
import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";
import { RoomTarget } from "./room-target";

export const dynamic = "force-dynamic";

type RoomDetail = {
  label: string;
  question: string;
  description: string;
  chooseWhen: string;
  comparison: string;
};

const ROOM_DETAILS: Record<number, RoomDetail> = {
  1: {
    label: "Belonging",
    question:
      "Being welcomed is not the same as being able to remain yourself.",
    description:
      "Some connections let you settle in without much effort. In others, you can find yourself reading the room, editing what you say, carrying more of the exchange, or deciding how much of yourself can show up. The Hearth stays with that difference long enough for the evidence of welcome, attention, conversational space, boundaries and mutual effort to become easier to see—without turning any of it into a verdict about you or anyone else.",
    chooseWhen:
      "you want clearer evidence of what helps you move closer, what makes you hold back, and where connection leaves enough room for you to remain yourself. The Hearth does not decide who belongs in your life; it helps you notice what connection is actually asking of you.",
    comparison: "Belonging that leaves room for you to remain yourself.",
  },
  2: {
    label: "Patterns",
    question: "Different relationship. Familiar pattern.",
    description:
      "Sometimes the people change but a familiar sequence does not. You may find yourself smoothing, fixing, explaining, leading, waiting, withdrawing, or carrying something before anyone has asked you to. Mirror slows recurring interactions down enough to separate what happened from the story that formed around it, what you did next, and what tended to follow. A pattern can become visible without becoming an identity—and your own participation can become clear without making the whole dynamic your responsibility.",
    chooseWhen:
      "a familiar dynamic keeps returning and you want to see what belongs to your participation—and what does not. Mirror looks for the places where another move may actually be available without diagnosing you, inventing someone else’s motive, or making the whole dynamic yours to carry.",
    comparison: "Different people. Familiar sequences. Notice what keeps travelling with you.",
  },
  3: {
    label: "Nourishment",
    question: "Care can be genuine and still be unsustainable.",
    description:
      "Care is not only intention. It has a footprint in time, attention, labour, energy, resources and rest. Some support gives capacity back. Some giving feels freely chosen. Some quietly becomes expected. The Garden makes that movement visible so you can notice what restores, what drains, what is being carried, and whether the way care moves between people can actually keep working.",
    chooseWhen:
      "care is present but the arrangement around it needs clearer attention. The Garden does not decide who is generous, selfish, loving or ungrateful. It helps make the practical flow visible enough to see what can continue, what needs to be shared or clarified, and what may need to change.",
    comparison: "Care that gives capacity back instead of quietly consuming it.",
  },
  4: {
    label: "Alignment",
    question: "Everything cannot come first.",
    description:
      "Several things can matter deeply and still compete for the same time, attention, energy or resources. Bearing puts stated priorities beside lived decisions so the trade-offs become easier to see: what keeps getting protected, what is repeatedly deferred, what changes under pressure, and where someone else’s input may be carrying more authority than you meant to give it. One choice is not a verdict on your character. The room is interested in the direction your choices are creating now.",
    chooseWhen:
      "several important things are competing, a decision keeps wobbling, or what you say matters and what your life is currently giving priority to no longer seem to point the same way. Bearing clarifies direction without deciding what should win or turning that clarity into an action plan.",
    comparison: "What gets protected, delayed or traded away makes current direction visible.",
  },
  5: {
    label: "Attraction",
    question: "Wanting something does not tell you what to do with it.",
    description:
      "A pull can be immediate. Meaning takes longer. Interest can grow, fade, sharpen or change once imagination meets information and real contact. Pulse gives desire somewhere to stay alive long enough to notice what is actually drawing you in, what you hope it will add, what becomes clearer when the pace changes, and whether movement needs action, more information, more time—or nothing yet. Desire can be real without becoming a verdict.",
    chooseWhen:
      "someone or something has your attention and you want to stay close to the wanting without either rushing toward it or talking yourself out of it. Pulse does not decide compatibility, destiny, identity or hidden meaning. It helps desire meet reality before choice.",
    comparison: "Desire can be real before its meaning—or its next move—is clear.",
  },
  6: {
    label: "Protection",
    question: "Sometimes reaction arrives before choice.",
    description:
      "Under pressure, a familiar response can move quickly enough to feel like the only response available. It may help in the moment and still leave a cost afterward. Shadow slows that sequence down without deciding where it came from. It makes room to notice what changed, what the reaction helped with, what became harder to see, what is actually true now, and where a response that once made sense may no longer need to make every decision.",
    chooseWhen:
      "a reaction feels stronger, faster or more familiar than you want it to be and you want to understand its usefulness, its cost, and whether another response is available now. Shadow does not assume trauma, a hidden wound, a defence mechanism or a diagnosis. The reaction can be respected without being handed the final say.",
    comparison: "Notice the reaction. Keep the choice.",
  },
  7: {
    label: "Conflict & Repair",
    question: "An apology is not the same thing as repair.",
    description:
      "Conflict can leave several stories tangled together: what happened, what each person meant, what followed, what belongs to whom, and whether anything has actually changed. Forge slows the exchange down enough to separate those pieces without inventing the other person’s inner world. It makes responsibility more specific, repair more observable, and participation more honest—because changed words matter, but changed participation is what gives repair somewhere to live.",
    chooseWhen:
      "a conflict or rupture is still taking up space and you need clearer ground for what is yours to own, what is not, what repair would need to look like in behaviour, and what you will choose if that repair is not available. Forge does not force reconciliation, manufacture remorse, or mediate the relationship.",
    comparison: "Repair becomes real when participation changes.",
  },
  8: {
    label: "Creation",
    question: "A future has to survive ordinary life.",
    description:
      "A shared future is easy to love while it is still made of feeling, possibility and someday. Vision brings it down into the ordinary: how days actually run, what people can count on, who owns which responsibilities, how decisions get made, what resources the life requires, what happens when someone cannot do their part, and which assumptions still need a real-world test. The point is not to make the future smaller. It is to make it specific enough to discover whether the life you are imagining can actually hold the people living it.",
    chooseWhen:
      "you can picture a future but the practical shape is still blurry—or when two people can agree on the dream without yet knowing whether they mean the same daily life. Vision does not predict, manifest or promise the future. It helps turn imagination into a design concrete enough to examine and test.",
    comparison: "Make the future specific enough to test.",
  },
  9: {
    label: "Integration",
    question: "Clarity does not require one neat story.",
    description:
      "When several experiences, decisions, contradictions and unfinished thoughts are alive at once, the pressure to find the one explanation can become its own kind of distortion. Gathering lets the pieces sit beside one another long enough to discover what genuinely connects, what is only similar, what remains true in tension with something else, what feels complete, what still needs action, and what is allowed to stay separate. Integration here is not compression. It is a fuller picture with the distinctions still intact.",
    chooseWhen:
      "you have gathered a lot of insight but do not want to force it into one grand lesson—or when several true things need to be held together without pretending they say the same thing. Gathering does not impose meaning or require every piece to connect.",
    comparison: "Gather the pieces. Keep the distinctions.",
  },
  10: {
    label: "Embodiment",
    question: "What becomes established through the way I live?",
    description:
      "Look at what your everyday expression, repeated participation, surrounding conditions, lived practice, and accumulated consequences are already making more established over time. Notice how living something also changes what you understand about it.",
    chooseWhen:
      "You understand plenty intellectually and want to see what your actual life is practising into existence.",
    comparison: "What is repetition already making more established?",
  },
};

async function getActiveRunDay(runId: string) {
  const continuedDays = await getRunContinuedDays(runId);

  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    if (!continuedDays.has(dayNumber)) return dayNumber;
  }

  return 7;
}

export default async function EntryPage({ searchParams }: { searchParams: Promise<{ visitError?: string; room?: string | string[] }> }) {
  const query = await searchParams;
  const roomTarget = getResonanceRoomTarget(query.room);
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(roomTarget?.entryPath ?? "/entry")}`);
  const [creditFlow, newCheckout] = await Promise.all([
    visitCreditsAvailableFor(userId),
    visitCheckoutAvailableFor(userId),
  ]);

  const [weeks, activeRun, runs, visitBalance] = await Promise.all([
    prisma.resonance_weeks.findMany({
      orderBy: { week_number: "asc" },
      select: {
        week_number: true,
        title: true,
        theme: true,
        is_published: true,
      },
    }),
    getActiveResonanceRun(userId),
    getResonanceWeekRuns(userId),
    creditFlow ? getVisitBalance(userId) : Promise.resolve(0),
  ]);

  const activeDay = activeRun ? await getActiveRunDay(activeRun.id) : null;
  const activeWeek = activeRun
    ? weeks.find((week) => week.week_number === activeRun.weekNumber)
    : null;

  const runsByWeek = new Map<number, typeof runs>();
  for (const run of runs) {
    const weekRuns = runsByWeek.get(run.weekNumber) ?? [];
    weekRuns.push(run);
    runsByWeek.set(run.weekNumber, weekRuns);
  }

  return (
    <main className="resonance-theme res-bg relative min-h-screen overflow-x-hidden">
      <RoomTarget weekNumber={roomTarget?.weekNumber} />
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 md:hidden"
        style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
      />
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat opacity-40 md:block"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="res-photo-overlay fixed inset-0 z-10" />

      <div className="relative z-20 min-h-screen">
        <MemberNav />

        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <header className="max-w-3xl">
            <h1 className="res-text text-4xl font-light tracking-tight md:text-5xl">
              Enter where you are
            </h1>
          </header>

          <section className="mt-14">
            <div className="max-w-3xl">
              <p className="res-accent text-xs uppercase tracking-[0.3em]">
                Resonance
              </p>
              <h2 className="res-text mt-3 text-3xl font-light">Which one do you choose?</h2>
              {creditFlow ? (
                <div className="res-accent-border res-panel mt-5 rounded-2xl border p-5">
                  <p className="res-accent text-lg font-medium">{visitBalance} unused visit{visitBalance === 1 ? "" : "s"}</p>
                  <p className="res-text-primary mt-2 text-base">Entering a room uses one visit. The other visits remain available for later.</p>
                  {newCheckout ? <Link href="/resonance/visits" className="res-accent res-accent-hover mt-3 inline-block text-base font-medium underline underline-offset-4">Buy visits</Link> : null}
                </div>
              ) : null}
              {query.visitError ? <p role="alert" className="res-alert mt-4 text-base">That room could not be opened. Check for an active visit or an unused visit below. No additional visit was deducted for the failed request.</p> : null}
              <p className="res-text-primary mt-4 text-base leading-8">
                {creditFlow ? "Each visit opens one seven-day Resonance room." : "Each purchase opens one seven-day Resonance room."} There is no
                required order. Choose the room containing the question that
                currently has your attention. When the visit closes, it remains
                available in the archive. Returning to the same room later opens a
                new visit while preserving the earlier one.
              </p>
            </div>

            <details className="res-accent-border res-panel group mt-8 rounded-3xl border backdrop-blur-[2px]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 md:px-7">
                <div>
                  <p className="res-accent text-xs uppercase tracking-[0.22em]">
                    Choosing between them
                  </p>
                  <h3 className="res-text mt-2 text-xl">Compare the rooms</h3>
                </div>
                <span className="res-accent transition group-open:rotate-180">
                  ↓
                </span>
              </summary>

              <div className="res-divider border-t px-6 py-6 md:px-7">
                <p className="res-text-primary max-w-3xl text-sm leading-7">
                  Every room is complete on its own. The difference is the question
                  it holds under attention for seven days.
                </p>

                <div className="res-border mt-6 overflow-hidden rounded-2xl border">
                  {weeks.map((week) => {
                    const detail = ROOM_DETAILS[week.week_number];
                    return (
                      <div
                        key={week.week_number}
                        className="res-divider grid gap-1 border-b px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr] md:gap-6"
                      >
                        <div>
                          <p className="res-text text-sm font-medium">{week.title}</p>
                          <p className="res-accent mt-1 text-xs uppercase tracking-[0.16em]">
                            {detail?.label ?? week.theme}
                          </p>
                        </div>
                        <p className="res-text-primary text-sm leading-6">
                          {detail?.comparison ?? week.theme}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <p className="res-text-secondary mt-5 text-sm leading-7">
                  There is no required order. Choose the room containing the question
                  that currently has your attention.
                </p>
              </div>
            </details>

            <div className="mt-8 space-y-4">
              {weeks.map((week) => {
                const detail = ROOM_DETAILS[week.week_number];
                const weekRuns = runsByWeek.get(week.week_number) ?? [];
                const completedRuns = weekRuns.filter(
                  (run) => run.status === "completed",
                );
                const preservedRuns = weekRuns.filter(
                  (run) => run.status === "preserved",
                );
                const hasArchivedHistory =
                  completedRuns.length > 0 || preservedRuns.length > 0;
                const isActive = activeRun?.weekNumber === week.week_number;
                const canRedeem = creditFlow && visitBalance > 0 && week.is_published && activeRun === null;
                const canPurchase = week.is_published && activeRun === null && !canRedeem;
                const nextRun = weekRuns.reduce((highest, run) => Math.max(highest, run.runNumber), 0) + 1;
                const isLockedByActive =
                  week.is_published && activeRun !== null && !isActive;

                const status = isActive
                  ? `Active · Day ${activeDay ?? 1}`
                  : completedRuns.length > 1
                    ? `${completedRuns.length} completed visits`
                    : completedRuns.length === 1
                      ? "Completed"
                      : preservedRuns.length > 0
                        ? "Preserved visit"
                        : isLockedByActive
                          ? "Locked"
                          : week.is_published
                            ? canRedeem ? "Use one visit" : "Available to purchase"
                            : "Unavailable";

                return (
                  <details
                    key={week.week_number}
                    id={`room-${week.week_number}`}
                    tabIndex={-1}
                    open={roomTarget ? roomTarget.weekNumber === week.week_number : isActive}
                    className="res-border res-panel group scroll-mt-6 rounded-3xl border backdrop-blur-[2px]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 md:px-7">
                      <div>
                        <p className="res-accent text-xs uppercase tracking-[0.22em]">
                          {detail?.label ?? week.theme}
                        </p>
                        <h3 className="res-text mt-2 text-xl">{week.title}</h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="res-border res-panel-soft res-text-secondary rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
                          {status}
                        </span>
                        <span className="res-accent transition group-open:rotate-180">
                          ↓
                        </span>
                      </div>
                    </summary>

                    <div className="res-divider border-t px-6 py-6 md:px-7">
                      {detail ? (
                        <div className="max-w-3xl">
                          <p className="res-text text-lg font-light leading-8">
                            {detail.question}
                          </p>
                          <p className="res-text-primary mt-3 text-sm leading-7">
                            {detail.description}
                          </p>
                          <p className="res-text-secondary mt-4 text-sm leading-7">
                            <span className="res-accent font-medium">Choose this room when:</span>{" "}
                            {detail.chooseWhen}
                          </p>
                        </div>
                      ) : (
                        <p className="res-text-primary max-w-3xl text-sm leading-7">
                          {week.theme}
                        </p>
                      )}

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        {isActive ? (
                          <Link
                            href="/resonance"
                            className="res-action inline-flex rounded-xl border px-5 py-2.5 text-sm font-medium transition"
                          >
                            Continue {week.title}
                          </Link>
                        ) : null}

                        {hasArchivedHistory ? (
                          <Link
                            href="/resonance/archive?view=journey"
                            className="res-secondary-action inline-flex rounded-xl border px-5 py-2.5 text-sm transition"
                          >
                            View previous visit{weekRuns.length === 1 ? "" : "s"}
                          </Link>
                        ) : null}

                        {canRedeem ? (
                          <form action={enterVisitRoom}>
                            <input type="hidden" name="weekNumber" value={week.week_number} />
                            <input type="hidden" name="requestId" value={randomUUID()} />
                            <VisitSubmitButton>{nextRun > 1 ? `Start round ${nextRun} · Use one visit` : "Enter room · Use one visit"}</VisitSubmitButton>
                            {nextRun > 1 ? <p className="res-text-secondary mt-3 text-sm">A fresh round. Previous reflections remain in the archive.</p> : null}
                          </form>
                        ) : null}

                        {canPurchase ? (
                          <Link
                            href={newCheckout ? "/resonance/visits" : `/resonance/purchase?week=${week.week_number}`}
                            className="res-action inline-flex flex-wrap items-center rounded-xl border px-5 py-2.5 text-sm font-medium transition"
                          >
                            <span>
                              {newCheckout ? "Buy visits" : hasArchivedHistory
                                ? `Purchase ${week.title} again`
                                : `Purchase ${week.title}`}
                            </span>
                          </Link>
                        ) : null}

                        {isLockedByActive ? (
                          <p className="res-text-disabled text-sm">
                            Complete {activeWeek?.title ?? "your active room"} before
                            opening another room.
                          </p>
                        ) : null}

                        {!week.is_published ? (
                          <p className="res-text-disabled text-sm">
                            This room will open when it is published.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
