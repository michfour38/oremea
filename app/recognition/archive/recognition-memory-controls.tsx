"use client";

import { useState } from "react";

import type { RecognitionEvidenceAnchor } from "@/src/lib/recognition/recognition-conversation";

function labelKind(kind: RecognitionEvidenceAnchor["kind"]) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export default function RecognitionMemoryControls({
  initialAnchors,
}: {
  initialAnchors: RecognitionEvidenceAnchor[];
}) {
  const [anchors, setAnchors] = useState(initialAnchors);
  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function removeMemory(anchor: RecognitionEvidenceAnchor) {
    const key = `${anchor.turnIndex}:${anchor.quote}`;
    setWorkingKey(key);
    setError("");

    try {
      const response = await fetch("/api/recognition/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnIndex: anchor.turnIndex,
          quote: anchor.quote,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok || !Array.isArray(data?.anchors)) {
        throw new Error(data?.error || "Recognition memory could not be changed.");
      }
      setAnchors(data.anchors as RecognitionEvidenceAnchor[]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Recognition memory could not be changed.",
      );
    } finally {
      setWorkingKey(null);
    }
  }

  async function clearMemory() {
    setWorkingKey("clear");
    setError("");

    try {
      const response = await fetch("/api/recognition/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Recognition memory could not be cleared.");
      }
      setAnchors([]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Recognition memory could not be cleared.",
      );
    } finally {
      setWorkingKey(null);
    }
  }

  return (
    <section className="rec-saved-panel mt-16 rounded-[2rem] border p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="rec-accent text-xs uppercase tracking-[0.22em]">
            What Recognition may remember
          </p>
          <h2 className="rec-text mt-2 font-serif text-2xl">
            Participant-controlled memory
          </h2>
          <p className="rec-text mt-4 text-sm leading-7">
            These are exact excerpts from your own messages that Recognition may
            carry into a future turn when they are relevant. Removing an excerpt
            stops it being used as long-term memory; your original conversation
            remains unchanged in the archive.
          </p>
        </div>

        {anchors.length > 0 ? (
          <button
            type="button"
            disabled={workingKey !== null}
            onClick={() => void clearMemory()}
            className="rec-text rounded-full border border-[var(--recognition-user-border)] px-4 py-2 text-xs transition hover:border-[var(--recognition-composer-focus)] hover:text-[var(--recognition-gold)] disabled:opacity-40"
          >
            Clear remembered excerpts
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rec-error-panel mt-5 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {anchors.length === 0 ? (
        <p className="rec-text mt-7 text-sm leading-7">
          Recognition is not currently carrying any long-term excerpts forward.
        </p>
      ) : (
        <div className="mt-7 space-y-3">
          {anchors.map((anchor) => {
            const key = `${anchor.turnIndex}:${anchor.quote}`;
            return (
              <div
                key={key}
                className="rec-user-bubble flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <p className="rec-text text-[10px] uppercase tracking-[0.18em]">
                    {labelKind(anchor.kind)} · turn {anchor.turnIndex}
                  </p>
                  <p className="rec-text mt-2 font-serif text-lg leading-8">
                    “{anchor.quote}”
                  </p>
                </div>
                <button
                  type="button"
                  disabled={workingKey !== null}
                  onClick={() => void removeMemory(anchor)}
                  className="rec-text shrink-0 text-left text-xs underline underline-offset-4 transition hover:text-[var(--recognition-gold)] disabled:opacity-40 md:text-right"
                >
                  {workingKey === key ? "Removing…" : "Do not carry this forward"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
