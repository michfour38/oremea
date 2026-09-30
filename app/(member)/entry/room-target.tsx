"use client";

import { useEffect } from "react";
import { RESONANCE_ROOM_NAMES } from "@/src/lib/resonance/room-entry";

export function RoomTarget({ weekNumber }: { weekNumber: number | undefined }) {
  useEffect(() => {
    if (weekNumber === undefined) return;
    const card = document.getElementById(`room-${weekNumber}`) as HTMLDetailsElement | null;
    if (card) card.open = true;
    card?.scrollIntoView({ block: "start" });
    card?.focus({ preventScroll: true });
  }, [weekNumber]);

  if (weekNumber === undefined) return null;

  const roomName = RESONANCE_ROOM_NAMES[weekNumber] ?? `Room ${weekNumber}`;

  function beginRememberedRoom() {
    const card = document.getElementById(`room-${weekNumber}`) as HTMLDetailsElement | null;
    if (card) card.open = true;
    card?.scrollIntoView({ behavior: "smooth", block: "start" });
    card?.focus({ preventScroll: true });
  }

  function compareRooms() {
    const comparison = document.querySelector("main details") as HTMLDetailsElement | null;
    if (comparison) comparison.open = true;
    comparison?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative z-30 mx-auto max-w-6xl px-6 pt-6">
      <div className="res-accent-border res-panel rounded-2xl border p-5 backdrop-blur-md">
        <p className="res-accent text-xs uppercase tracking-[0.22em]">You showed interest in {roomName}</p>
        <p className="res-text-primary mt-2 text-sm leading-7">
          Your visits are ready. Begin with {roomName}, or compare the rooms before choosing.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={beginRememberedRoom}
            className="res-action inline-flex rounded-xl border px-5 py-2.5 text-sm font-medium transition"
          >
            Begin with {roomName}
          </button>
          <button
            type="button"
            onClick={compareRooms}
            className="res-secondary-action inline-flex rounded-xl border px-5 py-2.5 text-sm transition"
          >
            Compare the rooms
          </button>
        </div>
      </div>
    </div>
  );
}
