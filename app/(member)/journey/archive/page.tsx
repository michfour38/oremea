import { getMirrorAccess } from "@/app/(member)/mirror/mirror-access";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getReflectionArchive } from "../journey.service";
import MemberNav from "../../member-nav";

type Props = {
  searchParams?: {
    view?: string;
    room?: string;
    entry?: string;
    q?: string;
  };
};

type ArchiveItem = {
  id: string;
  response: string;
  question: string;
  createdAt: Date | string;
  weekNumber: number | null;
  dayNumber: number | null;
  roomName: string | null;
};

type MirrorArchiveItem = {
  id: string;
  weekNumber: number;
  dayNumber: number;
  output: string;
  tier: string;
  createdAt: Date | string;
};

function formatArchiveDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function truncate(text: string, max = 180) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function cleanMirrorOutput(text: string) {
  return text
    .replace(/\*\*The mirror shows:\*\*/gi, "")
    .replace(/The mirror shows:/gi, "")
    .replace(/\*\*Two questions:\*\*/gi, "")
    .replace(/Two questions:/gi, "")
    .trim();
}

const archiveBackgroundDesktop = "/images/desktop/bg-archive.webp";
const archiveBackgroundMobile = "/images/mobile/bg-archive.webp";

const archiveOverlayStyle = {
  background:
    "radial-gradient(circle at top, rgba(34,40,48,0.14) 0%, rgba(10,10,10,0.34) 40%, rgba(0,0,0,0.66) 100%), linear-gradient(to bottom, rgba(0,0,0,0.14), rgba(0,0,0,0.38), rgba(0,0,0,0.58))",
};

export default async function ArchivePage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

const user = await currentUser();

const signedInEmail =
  user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
  user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
  "";

const mirrorAccess = signedInEmail
  ? await getMirrorAccess(signedInEmail)
  : {
      pathway: "discover",
      hasFullMirror: false,
      has2QOnly: true,
    };

  const reflections = (await getReflectionArchive(userId)) as ArchiveItem[];

  const mirrors = await prisma.mirror_responses.findMany({
    where: { user_id: userId },
    orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
    select: {
      id: true,
      week_number: true,
      day_number: true,
      output: true,
      tier: true,
      created_at: true,
    },
  });

  const mirrorItems: MirrorArchiveItem[] = mirrors.map((m) => ({
    id: m.id,
    weekNumber: m.week_number,
    dayNumber: m.day_number,
    output: cleanMirrorOutput(m.output),
    tier: m.tier,
    createdAt: m.created_at,
  }));

  const view = searchParams?.view ?? "day";
  const selectedRoom = searchParams?.room ?? "";
  const selectedEntryId = searchParams?.entry ?? "";
  const query = (searchParams?.q ?? "").trim().toLowerCase();

  const rooms = Array.from(
    new Set(reflections.map((r) => r.roomName).filter(Boolean))
  ) as string[];

  const roomEntries = selectedRoom
    ? reflections.filter((r) => r.roomName === selectedRoom)
    : [];

  const selectedEntry =
    reflections.find((r) => r.id === selectedEntryId) ?? null;

  const searchResults = query
    ? reflections.filter((r) => {
        const haystack = [
          r.question,
          r.response,
          r.roomName ?? "",
          r.dayNumber ? `day ${r.dayNumber}` : "",
          r.weekNumber ? `week ${r.weekNumber}` : "",
          formatArchiveDate(r.createdAt),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
    : [];

  const dayKeys = Array.from(
    new Set(
      reflections
        .filter((r) => r.weekNumber && r.dayNumber)
        .map((r) => `${r.weekNumber}-${r.dayNumber}`)
    )
  ).sort((a, b) => {
    const [aw, ad] = a.split("-").map(Number);
    const [bw, bd] = b.split("-").map(Number);
    if (aw !== bw) return aw - bw;
    return ad - bd;
  });

  const backHref =
    view === "room" && selectedRoom
      ? `/journey/archive?view=room&room=${encodeURIComponent(selectedRoom)}`
      : view === "search"
        ? `/journey/archive?view=search&q=${encodeURIComponent(
            searchParams?.q ?? ""
          )}`
        : "/journey/archive?view=day";

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

        <div className="mx-auto max-w-3xl space-y-12 px-6 py-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white">
              What has stayed
            </h1>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              A place to return to what has already moved through you.
            </p>
          </div>

          {view === "day" && !selectedEntry && (
            <div className="space-y-5">
              {dayKeys.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400 backdrop-blur-[2px]">
                  Nothing has been archived yet.
                </div>
              ) : (
                dayKeys.map((key) => {
                  const [weekNumber, dayNumber] = key.split("-").map(Number);

                  const dayReflections = reflections.filter(
                    (r) =>
                      r.weekNumber === weekNumber && r.dayNumber === dayNumber
                  );

                  const dayMirror = mirrorItems.find(
                    (m) =>
                      m.weekNumber === weekNumber && m.dayNumber === dayNumber
                  );

                  return (
                    <details
                      key={key}
                      className="rounded-[2rem] border border-zinc-800/80 bg-black/40 px-6 py-6 backdrop-blur-[2px]"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xl text-white">
                              Week {weekNumber} · Day {dayNumber}
                            </p>
                            <p className="mt-2 text-sm text-zinc-500">
                              {dayReflections.length}{" "}
                              {dayReflections.length === 1
                                ? "reflection"
                                : "reflections"}
                            </p>
                          </div>

                          <span className="text-sm text-zinc-500">Open</span>
                        </div>
                      </summary>

                      <div className="mt-6 space-y-7 border-t border-zinc-800/80 pt-6">
                        <section className="space-y-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Prompts
                          </p>

                          {dayReflections.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-2xl border border-zinc-800/80 bg-black/35 px-4 py-4"
                            >
                              <p className="text-[11px] tracking-[0.12em] text-zinc-500">
                                {r.roomName ? `${r.roomName} · ` : ""}
                                {formatArchiveDate(r.createdAt)}
                              </p>

                              <div className="mt-4 space-y-3">
                                <p className="text-sm leading-7 text-zinc-400">
                                  {r.question}
                                </p>

                                <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                                  {r.response}
                                </p>
                              </div>
                            </div>
                          ))}
                        </section>

                        <section>
                          <details className="rounded-2xl border border-[#6d5b2b]/35 bg-[#15120c]/80 px-5 py-4">
                            <summary className="cursor-pointer text-sm text-[#f1dfb4]">
                              Guidance
                            </summary>

                            <div className="mt-5 border-t border-[#6d5b2b]/30 pt-5">
                              {mirrorAccess.hasFullMirror && dayMirror ? (
  <div className="space-y-4">
    {dayMirror.output
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
) : mirrorAccess.hasFullMirror ? (
  <p className="text-sm leading-7 text-zinc-400">
    Mirror has not been generated for this day yet.
  </p>
) : (
  <p className="text-sm leading-7 text-zinc-400">
    This archive currently holds your prompts and reflections. Your 2 guiding
    questions are not archived as Mirror synthesis.
  </p>
)}
                            </div>
                          </details>
                        </section>
                      </div>
                    </details>
                  );
                })
              )}
            </div>
          )}

          {view === "room" && !selectedRoom && (
            <div className="space-y-5">
              {rooms.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400 backdrop-blur-[2px]">
                  Nothing has been archived yet.
                </div>
              ) : (
                rooms.map((room) => {
                  const roomReflections = reflections.filter(
                    (r) => r.roomName === room
                  );
                  const count = roomReflections.length;
                  const latest = roomReflections[0];

                  return (
                    <Link
                      key={room}
                      href={`/journey/archive?view=room&room=${encodeURIComponent(
                        room
                      )}`}
                      className="block rounded-[2rem] border border-zinc-800/80 bg-black/40 px-6 py-6 backdrop-blur-[2px] transition hover:border-zinc-700 hover:bg-black/50"
                    >
                      <div className="space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-xl text-white">{room}</p>
                            <p className="max-w-md text-sm leading-7 text-zinc-500">
                              Re-enter this room and move again through what it
                              once opened.
                            </p>
                          </div>

                          <p className="shrink-0 text-sm text-zinc-500">
                            {count} {count === 1 ? "reflection" : "reflections"}
                          </p>
                        </div>

                        {latest && (
                          <div className="rounded-2xl border border-zinc-800/80 bg-black/30 px-4 py-4">
                            <p className="text-[11px] tracking-[0.12em] text-zinc-500">
                              Most recent · {formatArchiveDate(latest.createdAt)}
                            </p>

                            <p className="mt-3 text-sm leading-7 text-zinc-300">
                              {truncate(latest.response, 150)}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {view === "room" && selectedRoom && !selectedEntry && (
            <div className="space-y-8">
              <div className="flex items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-medium text-white">
                    {selectedRoom}
                  </h2>
                </div>

                <Link
                  href="/journey/archive?view=room"
                  className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-zinc-300"
                >
                  Back to rooms
                </Link>
              </div>

              <div className="space-y-4">
                {roomEntries.map((r) => (
                  <Link
                    key={r.id}
                    href={`/journey/archive?view=room&room=${encodeURIComponent(
                      selectedRoom
                    )}&entry=${encodeURIComponent(r.id)}`}
                    className="block rounded-2xl border border-zinc-800/80 bg-black/40 px-5 py-5 backdrop-blur-[2px] transition hover:border-zinc-700 hover:bg-black/50"
                  >
                    <div className="space-y-3">
                      <p className="text-[11px] tracking-[0.12em] text-zinc-500">
                        {r.dayNumber ? `Day ${r.dayNumber} · ` : ""}
                        {formatArchiveDate(r.createdAt)}
                      </p>

                      <p className="text-sm leading-7 text-zinc-300">
                        {truncate(r.response, 220)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {view === "search" && !selectedEntry && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[11px] tracking-[0.18em] text-zinc-500">
                  SEARCH
                </p>
                <p className="text-sm leading-7 text-zinc-500">
                  Search for a phrase, feeling, room, or remembered thread.
                </p>
              </div>

              <form method="GET" action="/journey/archive" className="space-y-4">
                <input type="hidden" name="view" value="search" />

                <input
                  type="text"
                  name="q"
                  defaultValue={searchParams?.q ?? ""}
                  placeholder="Search your reflections..."
                  className="w-full rounded-2xl border border-zinc-800/80 bg-black/45 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 backdrop-blur-[2px] focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />
              </form>

              {query ? (
                searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((r) => (
                      <Link
                        key={r.id}
                        href={`/journey/archive?view=search&q=${encodeURIComponent(
                          searchParams?.q ?? ""
                        )}&entry=${encodeURIComponent(r.id)}`}
                        className="block rounded-2xl border border-zinc-800/80 bg-black/40 px-5 py-5 backdrop-blur-[2px] transition hover:border-zinc-700 hover:bg-black/50"
                      >
                        <div className="space-y-3">
                          <p className="text-[11px] tracking-[0.12em] text-zinc-500">
                            {formatArchiveDate(r.createdAt)}
                            {r.roomName ? ` · ${r.roomName}` : ""}
                          </p>

                          <p className="text-sm leading-7 text-zinc-300">
                            {truncate(r.response, 220)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400 backdrop-blur-[2px]">
                    Nothing matched that search.
                  </div>
                )
              ) : (
                <div className="rounded-3xl border border-zinc-800/80 bg-black/45 px-5 py-5 text-sm text-zinc-400 backdrop-blur-[2px]">
                  Search for a phrase, feeling, room, or day.
                </div>
              )}
            </div>
          )}

          {selectedEntry && (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-[11px] tracking-[0.18em] text-zinc-500">
                  PRESERVED MOMENT
                </p>
                <h2 className="text-2xl font-medium text-white">
                  {selectedEntry.roomName ?? "Reflection"}
                </h2>
              </div>

              <div className="rounded-[2rem] border border-zinc-800/80 bg-black/45 px-6 py-8 backdrop-blur-[2px] md:px-8 md:py-10">
                <div className="space-y-6">
                  <p className="text-[11px] tracking-[0.12em] text-zinc-500">
                    {formatArchiveDate(selectedEntry.createdAt)}
                    {selectedEntry.dayNumber
                      ? ` · Day ${selectedEntry.dayNumber}`
                      : ""}
                  </p>

                  <p className="text-sm leading-7 text-zinc-400">
                    {selectedEntry.question}
                  </p>

                  <p className="whitespace-pre-wrap text-[15px] leading-8 text-zinc-200 md:text-base">
                    {selectedEntry.response}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Link
                  href={backHref}
                  className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-zinc-300"
                >
                  Back
                </Link>

                <Link
                  href="/journey"
                  className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-zinc-300"
                >
                  Return to the present
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}