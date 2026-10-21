// Drafts are deliberately tab-local. Never migrate the unowned v1 draft.
const LEGACY_KEY = "oremea:recognition:composer:v1";
const PREFIX = "oremea:recognition:composer:v2:";
export const COMPOSER_TTL_MS = 30 * 60 * 1000;
const MAX_DRAFT_CHARS = 40_000;

type Composer = { draft: string; clientMessageId: string | null };
type Stores = { sessionStorage: Storage; localStorage: Storage };

function key(userId: string, threadId: string) {
  return `${PREFIX}${encodeURIComponent(userId)}:${encodeURIComponent(threadId)}`;
}

export function clearRecognitionDrafts(stores: Stores = window) {
  // Independent guards ensure blocked localStorage cannot prevent tab cleanup.
  try { stores.localStorage.removeItem(LEGACY_KEY); } catch {}
  try {
    for (let i = stores.sessionStorage.length - 1; i >= 0; i--) {
      const name = stores.sessionStorage.key(i);
      if (name?.startsWith(PREFIX)) stores.sessionStorage.removeItem(name);
    }
  } catch {}
}

export function readRecognitionComposer(
  userId: string, threadId: string, stores: Stores = window, now = Date.now(),
): Composer | null {
  try { stores.localStorage.removeItem(LEGACY_KEY); } catch {}
  try {
    const name = key(userId, threadId);
    // Discard drafts belonging to a different account in this tab.
    const accountPrefix = `${PREFIX}${encodeURIComponent(userId)}:`;
    for (let i = stores.sessionStorage.length - 1; i >= 0; i--) {
      const other = stores.sessionStorage.key(i);
      if (other?.startsWith(PREFIX) && !other.startsWith(accountPrefix)) {
        stores.sessionStorage.removeItem(other);
      }
    }
    const raw = stores.sessionStorage.getItem(name);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!userId || !threadId || value.userId !== userId || value.threadId !== threadId ||
        typeof value.draft !== "string" || value.draft.length > MAX_DRAFT_CHARS ||
        !Number.isFinite(value.expiresAt) || value.expiresAt <= now ||
        value.expiresAt > now + COMPOSER_TTL_MS ||
        !(value.clientMessageId === null || typeof value.clientMessageId === "string")) {
      stores.sessionStorage.removeItem(name);
      return null;
    }
    return { draft: value.draft, clientMessageId: value.clientMessageId };
  } catch { return null; }
}

export function writeRecognitionComposer(
  userId: string, threadId: string, draft: string, clientMessageId: string | null,
  stores: Stores = window, now = Date.now(),
) {
  if (!userId || !threadId || draft.length > MAX_DRAFT_CHARS) return;
  try {
    stores.sessionStorage.setItem(key(userId, threadId), JSON.stringify({
      userId, threadId, draft, clientMessageId, expiresAt: now + COMPOSER_TTL_MS,
    }));
  } catch { /* Submitted messages remain database-backed; tab recovery is best effort. */ }
}

export function removeRecognitionComposer(userId: string, threadId: string, stores: Stores = window) {
  try { stores.sessionStorage.removeItem(key(userId, threadId)); } catch {}
}
