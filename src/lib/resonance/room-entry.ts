export const RESONANCE_ROOM_NAMES: Record<number, string> = {
  1: "The Hearth",
  2: "The Mirror",
  3: "The Garden",
  4: "The Bearing",
  5: "The Pulse",
  6: "The Shadow",
  7: "The Forge",
  8: "The Vision",
  9: "The Gathering",
  10: "The Becoming",
};

// A room link selects a card only. Purchased runs remain the access authority.
export function getResonanceRoomTarget(room: string | string[] | undefined) {
  if (typeof room !== "string" || !/^(?:[1-9]|10)$/.test(room)) return null;

  const weekNumber = Number(room);
  return {
    weekNumber,
    name: RESONANCE_ROOM_NAMES[weekNumber],
    entryPath: `/entry?room=${room}`,
  };
}
