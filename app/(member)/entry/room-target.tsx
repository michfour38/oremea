"use client";

import { useEffect } from "react";

export function RoomTarget({ weekNumber }: { weekNumber: number | undefined }) {
  useEffect(() => {
    if (weekNumber === undefined) return;
    const card = document.getElementById(`room-${weekNumber}`);
    card?.scrollIntoView({ block: "start" });
    card?.focus({ preventScroll: true });
  }, [weekNumber]);

  return null;
}
