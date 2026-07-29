"use client";

import { useMemo, useState } from "react";

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
  discussionMessages,
  endingState,
}: {
  discussionMessages: DiscussionMessage[];
  endingState: CompassEndingState | null;
}) {
  const [view, setView] = useState<"discussion" | "map">("discussion");

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
  const completedMovements = useMemo(
    () =>
      endingState?.movements.filter((movement) => movement.status === "completed") ?? [],
    [endingState],
  );

  function jumpToDiscussion(sourceMessageIndex: number) {
    setView("discussion");
    window.setTimeout(() => {
      document
        .getElementById(`archive-discussion-${sourceMessageIndex}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
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
              className={`rounded-[1.4rem] p-5 text-sm leading-7 ${
                message.role === "compass"
                  ? "bg-[#12100D] text-zinc-400"
                  : "bg-[#121212] text-zinc-200"
              }`}
            >
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
          />

          <ArchiveList
            title="Completed movements"
            empty="No completed movements were saved in this run."
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
  items,
  onSource,
}: {
  title: string;
  empty: string;
  items: Array<{
    id: string;
    content: string;
    detail: string | null;
    sourceMessageIndex: number | null;
  }>;
  onSource: (index: number) => void;
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-500">
            {empty}
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
                  From discussion
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
