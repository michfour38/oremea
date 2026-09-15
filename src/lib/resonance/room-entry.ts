// A room link selects a card only. Purchased runs remain the access authority.
export function getResonanceRoomTarget(room: string | string[] | undefined) {
  if (typeof room !== "string" || !/^(?:[1-9]|10)$/.test(room)) return null;

  return {
    weekNumber: Number(room),
    entryPath: `/entry?room=${room}`,
  };
}
