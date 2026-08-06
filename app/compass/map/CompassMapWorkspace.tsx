"use client";

import { useEffect, useMemo, useState } from "react";

import { CompassMapOrderEnhancer } from "@/components/compass/CompassMapOrderEnhancer";
import type {
  CompassEndingState,
  CompassMapItem,
} from "@/src/lib/compass/ending/ending-types";

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

type EndingResponse = {
  state: CompassEndingState | null;
  error?: string;
};

export function CompassMapWorkspace() {
  const [state, setState] = useState<CompassEndingState | null>(null);
  const [view, setView] = useState<"active" | "completed">("active");
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const activeItems = useMemo(
    () =>
      state?.mapItems.filter(
        (item) => item.status === "active" || item.status === "waiting",
      ) ?? [],
    [state],
  );

  const completedItems = useMemo(
    () => state?.mapItems.filter((item) => item.status === "completed") ?? [],
    [state],
  );

  useEffect(() => {
    void loadMap();
  }, []);

  useEffect(() => {
    function handleReordered(event: Event) {
      const nextState = (
        event as CustomEvent<CompassEndingState | null>
      ).detail;

      if (!nextState) return;
      setState(nextState);
      setError("");
      window.dispatchEvent(new Event("compass-map-changed"));
    }

    window.addEventListener("compass-map-reordered", handleReordered);
    return () =>
      window.removeEventListener("compass-map-reordered", handleReordered);
  }, []);

  useEffect(() => {
    if (!loading && activeItems.length === 0 && completedItems.length > 0) {
      setView("completed");
    }
  }, [activeItems.length, completedItems.length, loading]);

  async function loadMap() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/compass/ending", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | EndingResponse
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Compass could not load the Map yet.");
        return;
      }

      setState(data?.state ?? null);
    } catch {
      setError("Compass could not load the Map yet.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    action: "complete_item" | "edit_item" | "release_item" | "restore_item",
    item: CompassMapItem,
    extra: Record<string, unknown> = {},
  ) {
    if (busyItemId) return;

    setBusyItemId(item.id);
    setError("");

    try {
      const response = await fetch("/api/compass/ending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          itemId: item.id,
          ...extra,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | EndingResponse
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Compass could not update the Map yet.");
        return;
      }

      setState(data?.state ?? null);
      window.dispatchEvent(new Event("compass-map-changed"));
    } catch {
      setError("Compass could not update the Map yet.");
    } finally {
      setBusyItemId(null);
    }
  }

  async function editItem(item: CompassMapItem) {
    const content = window.prompt("Edit this Map goal", item.content)?.trim();
    if (!content || content === item.content) return;
    await runAction("edit_item", item, { content });
  }

  return (
    <div className="mt-8">
      <CompassMapOrderEnhancer />

      <div className="grid grid-cols-2 rounded-full border border-zinc-800 bg-[#101010] p-1">
        <button
          type="button"
          onClick={() => setView("active")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            view === "active"
              ? "bg-[#21190F] text-[#E7C98B]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Active {activeItems.length}
        </button>
        <button
          type="button"
          onClick={() => setView("completed")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            view === "completed"
              ? "bg-[#21190F] text-[#E7C98B]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Completed {completedItems.length}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-[1.4rem] border border-[#5A4A2E] bg-[#17130D] p-5">
          <p className="text-sm leading-6 text-amber-200/80">{error}</p>
          <button
            type="button"
            onClick={() => void loadMap()}
            className="mt-3 text-sm text-[#C8A96A] underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 p-5 text-sm text-zinc-400">
          Loading Map...
        </div>
      ) : view === "active" ? (
        <section className="mt-7">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
            What&apos;s asking for attention
          </p>

          <div className="mt-4 space-y-3">
            {activeItems.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 p-5 text-sm leading-7 text-zinc-500">
                Nothing is currently asking for attention. Completed goals
                remain available beside this view.
              </div>
            ) : null}

            {activeItems.map((item) => (
              <div
                key={item.id}
                data-compass-map-id={item.id}
                className="flex gap-3 rounded-2xl border border-zinc-800 bg-[#121212] p-4"
              >
                <button
                  type="button"
                  aria-label={`Complete ${item.content}`}
                  onClick={() => void runAction("complete_item", item)}
                  disabled={busyItemId !== null}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border border-zinc-600 transition hover:border-[#d8b15f] disabled:opacity-50"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-zinc-200">
                    {item.content}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                    {item.area ? (
                      <span>{AREA_LABELS[item.area] ?? item.area}</span>
                    ) : null}
                    {item.status === "waiting" ? <span>Waiting</span> : null}
                    <button
                      type="button"
                      onClick={() => void editItem(item)}
                      disabled={busyItemId !== null}
                      className="transition hover:text-zinc-300 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void runAction("release_item", item)}
                      disabled={busyItemId !== null}
                      className="transition hover:text-zinc-300 disabled:opacity-50"
                    >
                      Move to Archive
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-7">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
            Completed
          </p>

          <div className="mt-4 space-y-3">
            {completedItems.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 p-5 text-sm leading-7 text-zinc-500">
                No completed goals are held here yet.
              </div>
            ) : null}

            {completedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-[#121212] p-4"
              >
                <p className="text-sm leading-6 text-zinc-200">
                  {item.content}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                  {item.area ? (
                    <span>{AREA_LABELS[item.area] ?? item.area}</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void runAction("restore_item", item)}
                    disabled={busyItemId !== null}
                    className="text-[#C8A96A] transition hover:text-[#E7C98B] disabled:opacity-50"
                  >
                    {busyItemId === item.id
                      ? "Returning..."
                      : "Return to Map"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
