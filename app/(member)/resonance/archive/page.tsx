import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getResonanceWeekState } from "@/src/lib/resonance/resonance-week-state";
import MemberNav from "../../member-nav";

type Props = {
  searchParams?: {
    view?: string;
    q?: string;
  };
};

type ReflectionItem = {
  id: string;
  response: string;
  question: string;
  promptOrder: number;
  createdAt: Date;
  weekNumber: number;
  dayNumber: number;
};

type GuidanceItem = {
  weekNumber: number;
  dayNumber: number;
  questionOne: string;
  questionTwo: string;
  answerOne: string | null;
  answerTwo: string | null;
  generatedAt: Date;
};

type MirrorItem = {
  id: string;
  weekNumber: number;
  output: string;
  createdAt: Date;
};

type DayGroup = {
  dayNumber: number;
  reflections: ReflectionItem[];
  guidance: GuidanceItem | null;
};

type WeekGroup = {
  weekNumber: number;
  title: string;
  theme: string;
  journeyPosition: number | null;
  status: "completed" | "active" | "preserved";
  days: DayGroup[];
  mirror: MirrorItem | null;
};

type SearchHit = {
  key: string;
  kind: "Reflection" | "2Q" | "Mirror";
  weekNumber: number;
  dayNumber: number | null;
  title: string;
  body: string;
};

const RESONANCE_WEEK_PREFIX = "resonance-week:";

const archiveBackgroundDesktop = "/images/desktop/bg-archive.webp";
const archiveBackgroundMobile = "/images/mobile/bg-archive.webp";

const archiveOverlayStyle = {
  background:
    "radial-gradient(circle at top, rgba(34,40,48,0.14) 0%, rgba(10,10,10,0.34) 40%, rgba(0,0,0,0.66) 100%), linear-gradient(to bottom, rgba(0,0,0,0.14), rgba(0,0,0,0.38), rgba(0,0,0,0.58))",
};

function parseWeekNumber(productKey: string) {
  if (!productKey.startsWith(RESONANCE_WEEK_PREFIX)) return null;

  const weekNumber = Number(productKey.slice(RESONANCE_WEEK_PREFIX.length));
  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 10
    ? weekNumber
    : null;
}

function parseLegacyQuestions(output: string) {
  return output
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^[-•]\s*/, "")
        .replace(/^\d+[\).\s-]+/, "")
        .trim(),
    )
    .filter((line) => line.includes("?"))
    .slice(0, 2);
}

function cleanMirrorOutput(text: string) {
  return text
    .replace(/\*\*The mirror shows:\*\*/gi, "")
    .replace(/The mirror shows:/gi, "")
    .replace(/\*\*Two questions:\*\*/gi, "")
    .replace(/Two questions:/gi, "")
    .trim();
}

function formatArchiveDate(value: Date) {
  return value.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function truncate(text: string, max = 240) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

async function getCompletedJourneyOrder(userId: string, activeWeek: number | null) {
  const [weekEntitlements, daySevenContinues, fullMirrors] = await Promise.all([
    prisma.oremea_entitlements.findMany({
      where: {
        user_id: userId,
        status: "completed",
        product_key: { startsWith: RESONANCE_WEEK_PREFIX },
      },
      orderBy: { updated_at: "asc" },
      select: { product_key: true, updated_at: true },
    }),
    prisma.resonance_day_continues.findMany({
      where: { user_id: userId, day_number: 7 },
      orderBy: { continued_at: "asc" },
      select: { week_number: true, continued_at: true },
    }),
    prisma.mirror_responses.findMany({
      where: { user_id: userId, day_number: 7, tier: "full" },
      orderBy: { created_at: "asc" },
      select: { week_number: true, created_at: true },
    }),
  ]);

  const completedAtByWeek = new Map<number, Date>();

  for (const row of fullMirrors) {
    if (row.week_number === activeWeek) continue;
    completedAtByWeek.set(row.week_number, row.created_at);
  }

  for (const row of daySevenContinues) {
    if (row.week_number === activeWeek) continue;

    const existing = completedAtByWeek.get(row.week_number);
    if (!existing || row.continued_at > existing) {
      completedAtByWeek.set(row.week_number, row.continued_at);
    }
  }

  for (const row of weekEntitlements) {
    const weekNumber = parseWeekNumber(row.product_key);
    if (weekNumber === null || weekNumber === activeWeek) continue;
    completedAtByWeek.set(weekNumber, row.updated_at);
  }

  return Array.from(completedAtByWeek.entries())
    .sort((a, b) => a[1].getTime() - b[1].getTime())
    .map(([weekNumber]) => weekNumber);
}

function DayArchiveCard({ day }: { day: DayGroup }) {
  return (
    <details className="rounded-2xl border border-zinc-800/80 bg-black/35 px-5 py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div>
          <p className="text-base text-zinc-100">Day {day.dayNumber}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {day.reflections.length}{" "}
            {day.reflections.length === 1 ? "reflection" : "reflections"}
            {day.guidance ? " · 2Q preserved" : ""}
          </p>
        </div>
        <span className="text-xs text-zinc-500">Expand</span>
      </summary>

      <div className="mt-5 space-y-6 border-t border-zinc-800/70 pt-5">
        {day.reflections.length > 0 ? (
          <section className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Reflections
            </p>

            {day.reflections.map((reflection) => (
              <div
                key={reflection.id}
                className="rounded-2xl border border-zinc-800/70 bg-black/30 px-4 py-4"
              >
                <p className="text-[11px] text-zinc-500">
                  {formatArchiveDate(reflection.createdAt)}
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {reflection.question}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                  {reflection.response}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {day.guidance ? (
          <section className="rounded-2xl border border-[#6d5b2b]/35 bg-[#17130d]/80 px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#b6a36a]">
              2Q
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[#efe4c6]">
              <div>
                <p>{day.guidance.questionOne}</p>
                {day.guidance.answerOne ? (
                  <p className="mt-2 whitespace-pre-wrap text-zinc-300">
                    {day.guidance.answerOne}
                  </p>
                ) : null}
              </div>
              <div>
                <p>{day.guidance.questionTwo}</p>
                {day.guidance.answerTwo ? (
                  <p className="mt-2 whitespace-pre-wrap text-zinc-300">
                    {day.guidance.answerTwo}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </details>
  );
}

function WeekArchiveCard({ group }: { group: WeekGroup }) {
  return (
    <details
      open={group.status === "active"}
      className="rounded-[2rem] border border-zinc-800/80 bg-black/40 px-6 py-6 backdrop-blur-[2px]"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#f1dfb4]/65">
              {group.journeyPosition
                ? `Journey position ${group.journeyPosition} · `
                : ""}
              Week {group.weekNumber}
            </p>
            <h2 className="mt-2 text-2xl text-white">{group.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
              {group.theme}
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
            {group.status}
          </span>
        </div>
      </summary>

      <div className="mt-7 space-y-5 border-t border-zinc-800/80 pt-6">
        {group.days.map((day) => (
          <DayArchiveCard key={day.dayNumber} day={day} />
        ))}

        {group.mirror ? (
          <section className="rounded-3xl border border-[#6d5b2b]/40 bg-[#15120c]/90 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#b6a36a]">
                Cumulative Mirror
              </p>
              <p className="text-xs text-zinc-500">
                {formatArchiveDate(group.mirror.createdAt)}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {cleanMirrorOutput(group.mirror.output)
                .split("\n\n")
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="whitespace-pre-wrap text-sm leading-7 text-[#efe4c6]"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </section>
        ) : group.status === "completed" ? (
          <p className="text-sm text-zinc-500">
            This completed week does not have a preserved weekly Mirror.
          </p>
        ) : null}
      </div>
    </details>
  );
}

export default async function ArchivePage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fresonance%2Farchive");

  const weekState = await getResonanceWeekState(userId);

  const [weeks, completions, guidanceRows, mirrorRows, completedJourneyOrder] =
    await Promise.all([
      prisma.resonance_weeks.findMany({
        orderBy: { week_number: "asc" },
        select: {
          week_number: true,
          title: true,
          theme: true,
        },
      }),
      prisma.prompt_completions.findMany({
        where: {
          user_id: userId,
          response: { not: "" },
        },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          response: true,
          created_at: true,
          day_prompts: {
            select: {
              content: true,
              prompt_order: true,
              resonance_days: {
                select: {
                  day_number: true,
                  resonance_weeks: {
                    select: { week_number: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.resonance_day_guidance.findMany({
        where: { user_id: userId },
        orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
        select: {
          week_number: true,
          day_number: true,
          question_one: true,
          question_two: true,
          answer_one: true,
          answer_two: true,
          generated_at: true,
        },
      }),
      prisma.mirror_responses.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          week_number: true,
          day_number: true,
          output: true,
          tier: true,
          created_at: true,
        },
      }),
      getCompletedJourneyOrder(userId, weekState.activeWeek),
    ]);

  const weekMeta = new Map(weeks.map((week) => [week.week_number, week]));

  const reflections: ReflectionItem[] = completions.map((completion) => ({
    id: completion.id,
    response: completion.response,
    question: completion.day_prompts.content,
    promptOrder: completion.day_prompts.prompt_order,
    createdAt: completion.created_at,
    weekNumber:
      completion.day_prompts.resonance_days.resonance_weeks.week_number,
    dayNumber: completion.day_prompts.resonance_days.day_number,
  }));

  const guidanceByDay = new Map<string, GuidanceItem>();

  for (const row of guidanceRows) {
    guidanceByDay.set(`${row.week_number}-${row.day_number}`, {
      weekNumber: row.week_number,
      dayNumber: row.day_number,
      questionOne: row.question_one,
      questionTwo: row.question_two,
      answerOne: row.answer_one,
      answerTwo: row.answer_two,
      generatedAt: row.generated_at,
    });
  }

  // Preserve 2Q generated before resonance_day_guidance became the daily store.
  for (const row of mirrorRows) {
    if (row.tier !== "lite") continue;

    const key = `${row.week_number}-${row.day_number}`;
    if (guidanceByDay.has(key)) continue;

    const questions = parseLegacyQuestions(row.output);
    if (questions.length !== 2) continue;

    guidanceByDay.set(key, {
      weekNumber: row.week_number,
      dayNumber: row.day_number,
      questionOne: questions[0],
      questionTwo: questions[1],
      answerOne: null,
      answerTwo: null,
      generatedAt: row.created_at,
    });
  }

  const fullMirrorByWeek = new Map<number, MirrorItem>();
  for (const row of mirrorRows) {
    if (row.tier !== "full" || row.day_number !== 7) continue;

    fullMirrorByWeek.set(row.week_number, {
      id: row.id,
      weekNumber: row.week_number,
      output: row.output,
      createdAt: row.created_at,
    });
  }

  const weeksWithData = new Set<number>();
  for (const reflection of reflections) weeksWithData.add(reflection.weekNumber);
  for (const guidance of guidanceByDay.values()) weeksWithData.add(guidance.weekNumber);
  for (const mirror of fullMirrorByWeek.values()) weeksWithData.add(mirror.weekNumber);
  for (const completedWeek of completedJourneyOrder) weeksWithData.add(completedWeek);
  if (weekState.activeWeek !== null) weeksWithData.add(weekState.activeWeek);

  const completedPosition = new Map(
    completedJourneyOrder.map((weekNumber, index) => [weekNumber, index + 1]),
  );

  const remainingDataWeeks = Array.from(weeksWithData)
    .filter(
      (weekNumber) =>
        !completedPosition.has(weekNumber) && weekNumber !== weekState.activeWeek,
    )
    .sort((a, b) => a - b);

  const journeyWeekOrder = [
    ...completedJourneyOrder,
    ...(weekState.activeWeek !== null ? [weekState.activeWeek] : []),
    ...remainingDataWeeks,
  ];

  const completedSet = new Set(completedJourneyOrder);

  const weekGroups: WeekGroup[] = journeyWeekOrder
    .map((weekNumber) => {
      const meta = weekMeta.get(weekNumber);
      if (!meta) return null;

      const days = Array.from({ length: 7 }, (_, index) => index + 1)
        .map((dayNumber) => {
          const dayReflections = reflections
            .filter(
              (reflection) =>
                reflection.weekNumber === weekNumber &&
                reflection.dayNumber === dayNumber,
            )
            .sort((a, b) => a.promptOrder - b.promptOrder);

          const guidance =
            guidanceByDay.get(`${weekNumber}-${dayNumber}`) ?? null;

          if (dayReflections.length === 0 && !guidance) return null;

          return {
            dayNumber,
            reflections: dayReflections,
            guidance,
          } satisfies DayGroup;
        })
        .filter((day): day is DayGroup => day !== null);

      return {
        weekNumber,
        title: meta.title,
        theme: meta.theme,
        journeyPosition: completedPosition.get(weekNumber) ?? null,
        status:
          weekState.activeWeek === weekNumber
            ? "active"
            : completedSet.has(weekNumber)
              ? "completed"
              : "preserved",
        days,
        mirror: fullMirrorByWeek.get(weekNumber) ?? null,
      } satisfies WeekGroup;
    })
    .filter((group): group is WeekGroup => group !== null);

  const requestedView = searchParams?.view ?? "day";
  const view = requestedView === "search" ? "search" : requestedView === "week" ? "week" : "journey";
  const query = (searchParams?.q ?? "").trim().toLowerCase();

  const displayGroups =
    view === "week"
      ? [...weekGroups].sort((a, b) => a.weekNumber - b.weekNumber)
      : weekGroups;

  const searchHits: SearchHit[] = query
    ? [
        ...reflections.flatMap((reflection) => {
          const haystack = `${reflection.question} ${reflection.response}`.toLowerCase();
          if (!haystack.includes(query)) return [];

          return [
            {
              key: `reflection-${reflection.id}`,
              kind: "Reflection" as const,
              weekNumber: reflection.weekNumber,
              dayNumber: reflection.dayNumber,
              title: reflection.question,
              body: reflection.response,
            },
          ];
        }),
        ...Array.from(guidanceByDay.values()).flatMap((guidance) => {
          const body = [
            guidance.questionOne,
            guidance.answerOne ?? "",
            guidance.questionTwo,
            guidance.answerTwo ?? "",
          ].join("\n\n");

          if (!body.toLowerCase().includes(query)) return [];

          return [
            {
              key: `guidance-${guidance.weekNumber}-${guidance.dayNumber}`,
              kind: "2Q" as const,
              weekNumber: guidance.weekNumber,
              dayNumber: guidance.dayNumber,
              title: `${guidance.questionOne}\n${guidance.questionTwo}`,
              body: [guidance.answerOne, guidance.answerTwo]
                .filter(Boolean)
                .join("\n\n"),
            },
          ];
        }),
        ...Array.from(fullMirrorByWeek.values()).flatMap((mirror) => {
          if (!mirror.output.toLowerCase().includes(query)) return [];

          return [
            {
              key: `mirror-${mirror.id}`,
              kind: "Mirror" as const,
              weekNumber: mirror.weekNumber,
              dayNumber: null,
              title: "Cumulative Mirror",
              body: cleanMirrorOutput(mirror.output),
            },
          ];
        }),
      ]
    : [];

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: `url(${archiveBackgroundDesktop})` }}
      />
      <div
        className="fixed inset-0 z-0 block bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${archiveBackgroundMobile})` }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={archiveOverlayStyle}
      />

      <div className="relative z-20 min-h-screen">
        <MemberNav />

        <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 md:py-12">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold text-white">What has stayed</h1>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              Return to the journey in the order you lived it, or revisit a week by
              its own identity.
            </p>
          </header>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/resonance/archive?view=day"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                view === "journey"
                  ? "border-[#c8a96a]/60 text-[#f1dfb4]"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              Journey order
            </Link>
            <Link
              href="/resonance/archive?view=week"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                view === "week"
                  ? "border-[#c8a96a]/60 text-[#f1dfb4]"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              Week order
            </Link>
            <Link
              href="/resonance/archive?view=search"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                view === "search"
                  ? "border-[#c8a96a]/60 text-[#f1dfb4]"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              Search
            </Link>
          </nav>

          {view !== "search" ? (
            displayGroups.length > 0 ? (
              <div className="space-y-5">
                {displayGroups.map((group) => (
                  <WeekArchiveCard key={group.weekNumber} group={group} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400">
                Nothing has been archived yet.
              </div>
            )
          ) : (
            <section className="space-y-6">
              <form method="GET" action="/resonance/archive">
                <input type="hidden" name="view" value="search" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchParams?.q ?? ""}
                  placeholder="Search reflections, 2Q, or Mirrors..."
                  className="w-full rounded-2xl border border-zinc-800/80 bg-black/45 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />
              </form>

              {query ? (
                searchHits.length > 0 ? (
                  <div className="space-y-4">
                    {searchHits.map((hit) => (
                      <div
                        key={hit.key}
                        className="rounded-2xl border border-zinc-800/80 bg-black/40 px-5 py-5"
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          {hit.kind} · Week {hit.weekNumber}
                          {hit.dayNumber ? ` · Day ${hit.dayNumber}` : ""}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                          {hit.title}
                        </p>
                        {hit.body ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                            {truncate(hit.body)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400">
                    Nothing matched that search.
                  </div>
                )
              ) : (
                <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400">
                  Search across your reflections, daily 2Q, and cumulative Mirrors.
                </div>
              )}
            </section>
          )}

          <div className="flex justify-end border-t border-zinc-800/80 pt-6">
            <Link
              href="/entry"
              className="text-sm text-zinc-400 underline underline-offset-4 transition hover:text-white"
            >
              Return to entry
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
