"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { CompassEndingState } from "@/src/lib/compass/ending/ending-types";

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

type DiscussionMessage = {
  role: "participant" | "compass";
  content: string;
};

export function CompassArchiveSessionView({
  sessionId,
  discussionMessages,
  endingState,
}: {
  sessionId: string;
  discussionMessages: DiscussionMessage[];
  endingState: CompassEndingState | null;
}) {
  const [view, setView] = useState<"discussion" | "map">("discussion");
  const [returningItemId, setReturningItemId] = useState<string | null>(null);
  const [returnedItemIds, setReturnedItemIds] = useState<string[]>([]);
  const [returnError, setReturnError] = useState("");
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState<number | null>(null);

  const completedItems = useMemo(
    () => endingState?.mapItems.filter((item) => item.status === "completed") ?? [],
    [endingState],
  );
  const heldItems = useMemo(
    () =>
      endingState?.mapItems.filter(
        (item) => item.status === "active" || item.status === "waiting",
      ) ?? [],
    [endingState],
  );
  const archivedItems = useMemo(
    () => endingState?.mapItems.filter((item) => item.status === "released") ?? [],
    [endingState],
  );
  const completedMovements = useMemo(
    () =>
      endingState?.movements.filter((movement) => movement.status === "completed") ?? [],
    [endingState],
  );

  async function returnToCurrentMap(itemId: string) {
    if (returningItemId) return;

    setReturningItemId(itemId);
    setReturnError("");

    try {
      const response = await fetch("/api/compass/map/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceSessionId: sessionId,
          itemId,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setReturnError(
          data?.error ?? "Compass could not return this goal to the Map yet.",
        );
        return;
      }

      setReturnedItemIds((current) =>
        current.includes(itemId) ? current : [...current, itemId],
      );
      window.dispatchEvent(new Event("compass-map-changed"));
    } catch {
      setReturnError("Compass could not return this goal to the Map yet.");
    } finally {
      setReturningItemId(null);
    }
  }

  function jumpToDiscussion(sourceMessageIndex: number) {
    setView("discussion");
    setHighlightedMessageIndex(sourceMessageIndex);

    window.setTimeout(() => {
      document
        .getElementById(`archive-discussion-${sourceMessageIndex}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);

    window.setTimeout(() => {
      setHighlightedMessageIndex((current) =>
        current === sourceMessageIndex ? null : current,
      );
    }, 3200);
  }

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 rounded-full border border-zinc-800 bg-[#101010] p-1">
        <button
          type="button"
          onClick={() => setView("discussion")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            view === "discussion"
              ? "bg-[#21190F] text-[#E7C98B]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Discussion
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            view === "map"
              ? "bg-[#21190F] text-[#E7C98B]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Map
        </button>
      </div>

      {view === "discussion" ? (
        <div className="mt-6 space-y-4">
          {discussionMessages.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 p-5 text-sm text-zinc-500">
              No conversation was saved in this Compass run.
            </div>
          ) : null}

          {discussionMessages.map((message, index) => (
            <div
              id={`archive-discussion-${index}`}
              key={`${message.role}-${index}`}
              className={`rounded-[1.4rem] border p-5 text-sm leading-7 transition duration-500 ${
                highlightedMessageIndex === index
                  ? "border-[#E7C98B] bg-[#21190F] shadow-[0_0_0_3px_rgba(231,201,139,0.14)]"
                  : message.role === "compass"
                    ? "border-transparent bg-[#12100D] text-zinc-400"
                    : "border-transparent bg-[#121212] text-zinc-200"
              }`}
            >
              {highlightedMessageIndex === index ? (
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[#E7C98B]">
                  Source for this Map item
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {endingState?.selectedArea ? (
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Started in · {AREA_LABELS[endingState.selectedArea] ?? endingState.selectedArea}
            </p>
          ) : null}

          {endingState?.reframe ? (
            <section className="rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                A simpler way to hold it
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {endingState.reframe}
              </p>
            </section>
          ) : null}

          {returnError ? (
            <p className="text-sm leading-6 text-amber-200/80">{returnError}</p>
          ) : null}

          <ArchiveList
            title="Current Map"
            empty="No current Map items were saved."
            items={heldItems.map((item) => ({
              id: item.id,
              content: item.content,
              detail: item.area ? AREA_LABELS[item.area] ?? item.area : null,
              sourceMessageIndex: item.sourceMessageIndex,
            }))}
            onSource={jumpToDiscussion}
            onReturn={returnToCurrentMap}
            returningItemId={returningItemId}
            returnedItemIds={returnedItemIds}
          />

          <ArchiveList
            title="Completed Map items"
            empty="No Map items were completed in this run."
            items={completedItems.map((item) => ({
              id: item.id,
              content: item.content,
              detail: item.area ? AREA_LABELS[item.area] ?? item.area : null,
              sourceMessageIndex: item.sourceMessageIndex,
            }))}
            onSource={jumpToDiscussion}
            onReturn={returnToCurrentMap}
            returningItemId={returningItemId}
            returnedItemIds={returnedItemIds}
          />

          <ArchiveList
            title="Moved to Archive"
            empty="No goals were moved to Archive in this run."
            items={archivedItems.map((item) => ({
              id: item.id,
              content: item.content,
              detail: item.area ? AREA_LABELS[item.area] ?? item.area : null,
              sourceMessageIndex: item.sourceMessageIndex,
            }))}
            onSource={jumpToDiscussion}
            onReturn={returnToCurrentMap}
            returningItemId={returningItemId}
            returnedItemIds={returnedItemIds}
          />

          <ArchiveList
            title="Completed movements"
            empty="No movement was completed during this archived run."
            emptyDetail="Movements are completed from the live Map."
            emptyHref="/compass/map"
            emptyLinkLabel="Open current Map"
            items={completedMovements.map((movement) => ({
              id: movement.id,
              content: movement.instruction,
              detail: movement.reason,
              sourceMessageIndex: null,
            }))}
            onSource={jumpToDiscussion}
          />
        </div>
      )}
    </div>
  );
}

function ArchiveList({
  title,
  empty,
  emptyDetail,
  emptyHref,
  emptyLinkLabel,
  items,
  onSource,
  onReturn,
  returningItemId,
  returnedItemIds = [],
}: {
  title: string;
  empty: string;
  emptyDetail?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
  items: Array<{
    id: string;
    content: string;
    detail: string | null;
    sourceMessageIndex: number | null;
  }>;
  onSource: (index: number) => void;
  onReturn?: (itemId: string) => void | Promise<void>;
  returningItemId?: string | null;
  returnedItemIds?: string[];
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-500">
            <p>{empty}</p>
            {emptyDetail ? (
              <p className="mt-2 leading-6 text-zinc-600">{emptyDetail}</p>
            ) : null}
            {emptyHref && emptyLinkLabel ? (
              <Link
                href={emptyHref}
                className="mt-3 inline-block text-[#E7C98B] underline underline-offset-4 transition hover:text-[#f1dfb4]"
              >
                {emptyLinkLabel} →
              </Link>
            ) : null}
          </div>
        ) : null}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-[#121212] p-4"
          >
            <p className="text-sm leading-6 text-zinc-200">{item.content}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-600">
              {item.detail ? <span>{item.detail}</span> : null}
              {item.sourceMessageIndex != null ? (
                <button
                  type="button"
                  onClick={() => onSource(item.sourceMessageIndex!)}
                  className="text-zinc-500 underline underline-offset-4 transition hover:text-[#d8b15f]"
                >
                  Open source in Discussion
                </button>
              ) : null}
              {onReturn ? (
                <button
                  type="button"
                  onClick={() => void onReturn(item.id)}
                  disabled={
                    returningItemId === item.id ||
                    returnedItemIds.includes(item.id)
                  }
                  className="text-[#C8A96A] transition hover:text-[#E7C98B] disabled:cursor-default disabled:text-zinc-600"
                >
                  {returnedItemIds.includes(item.id)
                    ? "On current Map"
                    : returningItemId === item.id
                      ? "Returning..."
                      : "Return to current Map"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
