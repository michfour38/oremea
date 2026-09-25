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
  searchParams?: Promise<{
    view?: string;
    q?: string;
  }>;
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
    <details className="res-border res-panel-soft rounded-2xl border px-5 py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div>
          <p className="res-text-primary text-base">Day {day.dayNumber}</p>
          <p className="res-text-secondary mt-1 text-xs">
            {day.reflections.length}{" "}
            {day.reflections.length === 1 ? "reflection" : "reflections"}
            {day.guidance ? " · 2Q preserved" : ""}
          </p>
        </div>
        <span className="res-text-secondary text-xs">Expand</span>
      </summary>

      <div className="res-divider mt-5 space-y-6 border-t pt-5">
        {day.reflections.length > 0 ? (
          <section className="space-y-4">
            <p className="res-text-secondary text-[11px] uppercase tracking-[0.18em]">
              Reflections
            </p>

            {day.reflections.map((reflection) => (
              <div
                key={reflection.id}
                className="res-border res-panel-soft rounded-2xl border px-4 py-4"
              >
                <p className="res-text-secondary text-[11px]">
                  {formatArchiveDate(reflection.createdAt)}
                </p>
                <p className="res-text-secondary mt-3 text-sm leading-7">
                  {reflection.question}
                </p>
                <p className="res-text-primary mt-3 whitespace-pre-wrap text-sm leading-7">
                  {reflection.response}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {day.guidance ? (
          <section className="res-accent-panel rounded-2xl border px-5 py-5">
            <p className="res-accent text-[11px] uppercase tracking-[0.2em]">
              2Q
            </p>
            <div className="res-accent mt-4 space-y-5 text-sm leading-7">
              <div>
                <p>{day.guidance.questionOne}</p>
                {day.guidance.answerOne ? (
                  <p className="res-text-primary mt-2 whitespace-pre-wrap">
                    {day.guidance.answerOne}
                  </p>
                ) : null}
              </div>
              <div>
                <p>{day.guidance.questionTwo}</p>
                {day.guidance.answerTwo ? (
                  <p className="res-text-primary mt-2 whitespace-pre-wrap">
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
      className="res-border res-panel rounded-[2rem] border px-6 py-6 backdrop-blur-[2px]"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="res-accent text-[11px] uppercase tracking-[0.2em]">
              Journey position {group.journeyPosition} · Week {group.weekNumber} · Visit {group.runNumber}
            </p>
            <h2 className="res-text mt-2 text-2xl">{group.title}</h2>
            <p className="res-text-secondary mt-2 max-w-xl text-sm leading-7">
              {group.theme}
            </p>
            <p className="res-text-secondary mt-3 text-xs">
              Began {formatArchiveDate(group.startedAt)}
              {group.completedAt
                ? ` · Completed ${formatArchiveDate(group.completedAt)}`
                : ""}
            </p>
          </div>

          <span className="res-border res-text-secondary shrink-0 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
            {group.status}
          </span>
        </div>
      </summary>

      <div className="res-divider mt-7 space-y-5 border-t pt-6">
        {group.days.map((day) => (
          <DayArchiveCard key={day.dayNumber} day={day} />
        ))}

        {group.mirror ? (
          <section className="res-accent-panel rounded-3xl border px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="res-accent text-[11px] uppercase tracking-[0.22em]">
                Cumulative Mirror
              </p>
              <p className="res-text-secondary text-xs">
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
                    className="res-accent whitespace-pre-wrap text-sm leading-7"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </section>
        ) : group.status === "completed" ? (
          <p className="res-text-secondary text-sm">
            This completed visit does not have a preserved cumulative Mirror.
          </p>
        ) : null}
      </div>
    </details>
  );
}

export default async function ArchivePage(props: Props) {
  const searchParams = await props.searchParams;
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
    <main className="resonance-theme relative min-h-screen overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: `url(${archiveBackgroundDesktop})` }}
      />
      <div
        className="fixed inset-0 z-0 block bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${archiveBackgroundMobile})` }}
      />
      <div className="res-archive-overlay pointer-events-none fixed inset-0 z-10" />

      <div className="relative z-20 min-h-screen">
        <MemberNav />

        <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 md:py-12">
          <header className="space-y-3">
            <h1 className="res-text text-3xl font-semibold">What has stayed</h1>
            <p className="res-text-secondary max-w-xl text-sm leading-7">
              Return to each Resonance visit as it was lived. Repeating a room creates
              a new visit while the earlier visit stays intact.
            </p>
          </header>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/resonance/archive?view=journey"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                view === "journey" ? "res-action" : "res-secondary-action"
              }`}
            >
              Journey order
            </Link>
            <Link
              href="/resonance/archive?view=week"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                view === "week" ? "res-action" : "res-secondary-action"
              }`}
            >
              Week order
            </Link>
            <Link
              href="/resonance/archive?view=search"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                view === "search" ? "res-action" : "res-secondary-action"
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
              <div className="res-border res-panel res-text-secondary rounded-3xl border px-5 py-5 text-sm">
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
                  className="res-field w-full rounded-2xl border px-4 py-3 text-sm"
                />
              </form>

              {query ? (
                searchHits.length > 0 ? (
                  <div className="space-y-4">
                    {searchHits.map((hit) => (
                      <div
                        key={hit.key}
                        className="res-border res-panel rounded-2xl border px-5 py-5"
                      >
                        <p className="res-text-secondary text-[11px] uppercase tracking-[0.18em]">
                          {hit.kind} · Week {hit.weekNumber} · Visit {hit.runNumber}
                          {hit.dayNumber ? ` · Day ${hit.dayNumber}` : ""}
                        </p>
                        <p className="res-text-secondary mt-3 whitespace-pre-wrap text-sm leading-7">
                          {hit.title}
                        </p>
                        {hit.body ? (
                          <p className="res-text-primary mt-3 whitespace-pre-wrap text-sm leading-7">
                            {truncate(hit.body)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="res-border res-panel res-text-secondary rounded-3xl border px-5 py-5 text-sm">
                    Nothing matched that search.
                  </div>
                )
              ) : (
                <div className="res-border res-panel res-text-secondary rounded-3xl border px-5 py-5 text-sm">
                  Search across your reflections, daily 2Q, and cumulative Mirrors.
                </div>
              )}
            </section>
          )}

          <div className="res-divider flex justify-end border-t pt-6">
            <Link
              href="/entry"
              className="res-text-secondary res-accent-hover text-sm underline underline-offset-4 transition"
            >
              Return to entry
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
