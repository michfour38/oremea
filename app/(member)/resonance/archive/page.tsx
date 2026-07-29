import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { backfillLegacyResonanceGuidance } from "@/src/lib/resonance/backfill-legacy-guidance";
import {
  getResonanceWeekRuns,
  type ResonanceWeekRun,
} from "@/src/lib/resonance/resonance-week-run";
import MemberNav from "../../member-nav";

type Props = {
  searchParams?: {
    view?: string;
    q?: string;
  };
};

type ReflectionRow = {
  id: string;
  run_id: string;
  response: string;
  created_at: Date;
  question: string;
  prompt_order: number;
  day_number: number;
};

type GuidanceRow = {
  run_id: string;
  day_number: number;
  question_one: string;
  question_two: string;
  answer_one: string | null;
  answer_two: string | null;
  generated_at: Date;
};

type MirrorRow = {
  id: string;
  run_id: string;
  output: string;
  created_at: Date;
};

type ReflectionItem = {
  id: string;
  response: string;
  question: string;
  promptOrder: number;
  createdAt: Date;
  dayNumber: number;
};

type GuidanceItem = {
  dayNumber: number;
  questionOne: string;
  questionTwo: string;
  answerOne: string | null;
  answerTwo: string | null;
  generatedAt: Date;
};

type MirrorItem = {
  id: string;
  output: string;
  createdAt: Date;
};

type DayGroup = {
  dayNumber: number;
  reflections: ReflectionItem[];
  guidance: GuidanceItem | null;
};

type RunGroup = {
  runId: string;
  weekNumber: number;
  runNumber: number;
  title: string;
  theme: string;
  journeyPosition: number;
  status: ResonanceWeekRun["status"];
  startedAt: Date;
  completedAt: Date | null;
  days: DayGroup[];
  mirror: MirrorItem | null;
};

type SearchHit = {
  key: string;
  kind: "Reflection" | "2Q" | "Mirror";
  weekNumber: number;
  runNumber: number;
  dayNumber: number | null;
  title: string;
  body: string;
};

const archiveBackgroundDesktop = "/images/desktop/bg-archive.webp";
const archiveBackgroundMobile = "/images/mobile/bg-archive.webp";

const archiveOverlayStyle = {
  background:
    "radial-gradient(circle at top, rgba(34,40,48,0.14) 0%, rgba(10,10,10,0.34) 40%, rgba(0,0,0,0.66) 100%), linear-gradient(to bottom, rgba(0,0,0,0.14), rgba(0,0,0,0.38), rgba(0,0,0,0.58))",
};

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

function runSortTime(run: ResonanceWeekRun) {
  return (run.completedAt ?? run.startedAt).getTime();
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
            <div className="mt-4 space-y-5 text-sm leading-7 text-[#efe4c6]">
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

function RunArchiveCard({ group }: { group: RunGroup }) {
  return (
    <details
      open={group.status === "active"}
      className="rounded-[2rem] border border-zinc-800/80 bg-black/40 px-6 py-6 backdrop-blur-[2px]"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#f1dfb4]/65">
              Journey position {group.journeyPosition} · Week {group.weekNumber} · Run {group.runNumber}
            </p>
            <h2 className="mt-2 text-2xl text-white">{group.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
              {group.theme}
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              Began {formatArchiveDate(group.startedAt)}
              {group.completedAt
                ? ` · Completed ${formatArchiveDate(group.completedAt)}`
                : ""}
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
            This completed run does not have a preserved cumulative Mirror.
          </p>
        ) : null}
      </div>
    </details>
  );
}

export default async function ArchivePage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fresonance%2Farchive");

  await backfillLegacyResonanceGuidance(userId);

  const [weeks, runs] = await Promise.all([
    prisma.resonance_weeks.findMany({
      orderBy: { week_number: "asc" },
      select: {
        week_number: true,
        title: true,
        theme: true,
      },
    }),
    getResonanceWeekRuns(userId),
  ]);

  const runIds = runs.map((run) => run.id);

  const [reflectionRows, guidanceRows, mirrorRows] =
    runIds.length > 0
      ? await Promise.all([
          prisma.$queryRaw<ReflectionRow[]>`
            SELECT
              pc."id",
              pc."run_id",
              pc."response",
              pc."created_at",
              dp."content" AS "question",
              dp."prompt_order",
              rd."day_number"
            FROM "prompt_completions" pc
            JOIN "day_prompts" dp ON dp."id" = pc."prompt_id"
            JOIN "journey_days" rd ON rd."id" = dp."day_id"
            WHERE pc."run_id" = ANY(${runIds}::uuid[])
              AND BTRIM(pc."response") <> ''
            ORDER BY pc."created_at" ASC
          `,
          prisma.$queryRaw<GuidanceRow[]>`
            SELECT
              "run_id",
              "day_number",
              "question_one",
              "question_two",
              "answer_one",
              "answer_two",
              "generated_at"
            FROM "resonance_day_guidance"
            WHERE "run_id" = ANY(${runIds}::uuid[])
            ORDER BY "generated_at" ASC, "day_number" ASC
          `,
          prisma.$queryRaw<MirrorRow[]>`
            SELECT
              "id",
              "run_id",
              "output",
              "created_at"
            FROM "mirror_responses"
            WHERE "run_id" = ANY(${runIds}::uuid[])
              AND "day_number" = 7
              AND "tier" = 'full'
            ORDER BY "created_at" ASC
          `,
        ])
      : [[], [], []];

  const weekMeta = new Map(weeks.map((week) => [week.week_number, week]));
  const runById = new Map(runs.map((run) => [run.id, run]));

  const reflectionsByRunDay = new Map<string, ReflectionItem[]>();
  for (const row of reflectionRows) {
    const key = `${row.run_id}-${row.day_number}`;
    const current = reflectionsByRunDay.get(key) ?? [];
    current.push({
      id: row.id,
      response: row.response,
      question: row.question,
      promptOrder: row.prompt_order,
      createdAt: row.created_at,
      dayNumber: row.day_number,
    });
    reflectionsByRunDay.set(key, current);
  }

  const guidanceByRunDay = new Map<string, GuidanceItem>();
  for (const row of guidanceRows) {
    guidanceByRunDay.set(`${row.run_id}-${row.day_number}`, {
      dayNumber: row.day_number,
      questionOne: row.question_one,
      questionTwo: row.question_two,
      answerOne: row.answer_one,
      answerTwo: row.answer_two,
      generatedAt: row.generated_at,
    });
  }

  const mirrorByRun = new Map<string, MirrorItem>();
  for (const row of mirrorRows) {
    mirrorByRun.set(row.run_id, {
      id: row.id,
      output: row.output,
      createdAt: row.created_at,
    });
  }

  const journeyRuns = [...runs].sort((a, b) => {
    const timeDifference = runSortTime(a) - runSortTime(b);
    if (timeDifference !== 0) return timeDifference;
    if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
    return a.runNumber - b.runNumber;
  });

  const journeyPositionByRun = new Map(
    journeyRuns.map((run, index) => [run.id, index + 1]),
  );

  const runGroups: RunGroup[] = journeyRuns
    .map((run) => {
      const meta = weekMeta.get(run.weekNumber);
      if (!meta) return null;

      const days = Array.from({ length: 7 }, (_, index) => index + 1)
        .map((dayNumber) => {
          const reflections = [
            ...(reflectionsByRunDay.get(`${run.id}-${dayNumber}`) ?? []),
          ].sort((a, b) => a.promptOrder - b.promptOrder);
          const guidance =
            guidanceByRunDay.get(`${run.id}-${dayNumber}`) ?? null;

          if (reflections.length === 0 && !guidance) return null;

          return {
            dayNumber,
            reflections,
            guidance,
          } satisfies DayGroup;
        })
        .filter((day): day is DayGroup => day !== null);

      return {
        runId: run.id,
        weekNumber: run.weekNumber,
        runNumber: run.runNumber,
        title: meta.title,
        theme: meta.theme,
        journeyPosition: journeyPositionByRun.get(run.id) ?? 0,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        days,
        mirror: mirrorByRun.get(run.id) ?? null,
      } satisfies RunGroup;
    })
    .filter((group): group is RunGroup => group !== null);

  const requestedView = searchParams?.view ?? "journey";
  const view =
    requestedView === "search"
      ? "search"
      : requestedView === "week"
        ? "week"
        : "journey";
  const query = (searchParams?.q ?? "").trim().toLowerCase();

  const displayGroups =
    view === "week"
      ? [...runGroups].sort((a, b) => {
          if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
          return a.runNumber - b.runNumber;
        })
      : runGroups;

  const searchHits: SearchHit[] = query
    ? [
        ...reflectionRows.flatMap((row) => {
          const run = runById.get(row.run_id);
          if (!run) return [];
          const haystack = `${row.question} ${row.response}`.toLowerCase();
          if (!haystack.includes(query)) return [];

          return [
            {
              key: `reflection-${row.id}`,
              kind: "Reflection" as const,
              weekNumber: run.weekNumber,
              runNumber: run.runNumber,
              dayNumber: row.day_number,
              title: row.question,
              body: row.response,
            },
          ];
        }),
        ...guidanceRows.flatMap((row) => {
          const run = runById.get(row.run_id);
          if (!run) return [];
          const body = [
            row.question_one,
            row.answer_one ?? "",
            row.question_two,
            row.answer_two ?? "",
          ].join("\n\n");

          if (!body.toLowerCase().includes(query)) return [];

          return [
            {
              key: `guidance-${row.run_id}-${row.day_number}`,
              kind: "2Q" as const,
              weekNumber: run.weekNumber,
              runNumber: run.runNumber,
              dayNumber: row.day_number,
              title: `${row.question_one}\n${row.question_two}`,
              body: [row.answer_one, row.answer_two].filter(Boolean).join("\n\n"),
            },
          ];
        }),
        ...mirrorRows.flatMap((row) => {
          const run = runById.get(row.run_id);
          if (!run || !row.output.toLowerCase().includes(query)) return [];

          return [
            {
              key: `mirror-${row.id}`,
              kind: "Mirror" as const,
              weekNumber: run.weekNumber,
              runNumber: run.runNumber,
              dayNumber: null,
              title: "Cumulative Mirror",
              body: cleanMirrorOutput(row.output),
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
              Return to each Resonance visit as it was lived. Repeating a room creates
              a new run while the earlier visit stays intact.
            </p>
          </header>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/resonance/archive?view=journey"
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
                  <RunArchiveCard key={group.runId} group={group} />
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
                          {hit.kind} · Week {hit.weekNumber} · Run {hit.runNumber}
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
