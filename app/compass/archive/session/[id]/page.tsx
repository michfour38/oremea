import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import MemberNav from "@/app/(member)/member-nav";
import { prisma } from "@/lib/prisma";
import {
  createEmptyCompassEndingState,
  type CompassEndingState,
} from "@/src/lib/compass/ending/ending-types";
import type { CompassScopeCategory } from "@/src/lib/compass/scope-boundary";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

import { CompassArchiveSessionView } from "./CompassArchiveSessionView";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const AREA_LABELS: Record<string, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CompassArchiveSessionPage(props: Props) {
  const params = await props.params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const access = await getCompassAccessState(userId);

  const session = await prisma.compass_sessions.findFirst({
    where: {
      id: params.id,
      user_id: userId,
      status: {
        in: ["active", "complete"],
      },
    },
    select: {
      id: true,
      selected_area: true,
      discussion_messages: true,
      detected_patterns: true,
      resolution_text: true,
      resolution_confirmed_at: true,
      final_step: true,
      final_step_confirmed_at: true,
      updated_at: true,
    },
  });

  if (!session) {
    notFound();
  }

  const endingState = readEndingState(
    session.detected_patterns,
    session.selected_area,
  );
  const discussionMessages = readDiscussionMessages(session.discussion_messages);
  const areaLabel = session.selected_area
    ? AREA_LABELS[session.selected_area] ?? session.selected_area
    : "Compass";

  return (
    <main id="top" className="min-h-screen bg-[#090909] text-white">
      <MemberNav />

      <section className="mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/compass/archive"
          className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-[#d8b15f]"
        >
          ← Back to Compass Archive
        </Link>

        <header className="mt-10 border-b border-zinc-800/80 pb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[#d8b15f]">
            Compass Archive
          </p>
          <h1 className="mt-5 text-4xl font-light text-white md:text-6xl">
            {areaLabel}
          </h1>
          <p className="mt-4 text-sm text-zinc-500">
            {formatDate(session.updated_at)}
          </p>
        </header>

        <CompassArchiveSessionView
          sessionId={session.id}
          discussionMessages={discussionMessages}
          endingState={endingState}
          resolutionText={
            session.resolution_confirmed_at ? session.resolution_text : null
          }
          finalStep={
            session.final_step_confirmed_at ? session.final_step : null
          }
          canRestoreToMap={access.active}
        />
      </section>

      <a
        href="#top"
        aria-label="Return to top"
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[#d8b15f]/70 bg-[#090909]/90 text-2xl text-[#d8b15f] shadow-lg backdrop-blur transition hover:border-[#d8b15f] hover:bg-[#17130b] md:bottom-5"
      >
        ↟
      </a>
    </main>
  );
}

function readDiscussionMessages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const role = row.role === "participant" ? "participant" : "compass";
      const content = typeof row.content === "string" ? row.content : "";
      if (!content) return null;
      return { role, content } as const;
    })
    .filter((item): item is { role: "participant" | "compass"; content: string } =>
      Boolean(item),
    );
}

function readEndingState(
  value: unknown,
  selectedArea: string | null,
): CompassEndingState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const row = value as Record<string, unknown>;
  if (row.version !== 1) return null;

  const empty = createEmptyCompassEndingState(selectedArea);

  return {
    ...empty,
    selectedArea:
      typeof row.selectedArea === "string" ? row.selectedArea : selectedArea,
    mapItems: Array.isArray(row.mapItems)
      ? (row.mapItems as CompassEndingState["mapItems"])
      : [],
    mapReviewed: row.mapReviewed === true,
    movements: Array.isArray(row.movements)
      ? (row.movements as CompassEndingState["movements"])
      : [],
    currentMovementId:
      typeof row.currentMovementId === "string" ? row.currentMovementId : null,
    reframe: typeof row.reframe === "string" ? row.reframe : null,
    followUpQuestion:
      typeof row.followUpQuestion === "string" ? row.followUpQuestion : null,
    movementReady: row.movementReady === true,
    scopeCategory: isScopeCategory(row.scopeCategory)
      ? row.scopeCategory
      : "in_scope",
    discussionCount:
      typeof row.discussionCount === "number" ? row.discussionCount : 0,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : empty.updatedAt,
  };
}

function isScopeCategory(value: unknown): value is CompassScopeCategory {
  return (
    value === "in_scope" ||
    value === "self_harm_intent" ||
    value === "medical" ||
    value === "legal" ||
    value === "regulated_professional"
  );
}
