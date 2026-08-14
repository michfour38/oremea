"use client";

import MemberNav from "@/app/(member)/member-nav";
import { useEffect, useRef, useState } from "react";

export type RecognitionChatMessage = {
  role: "user" | "assistant";
  content: string;
  turnIndex: number;
  clientMessageId?: string | null;
  createdAt: string;
};

type StoredRecognitionComposer = {
  draft: string;
  clientMessageId: string | null;
};

const COMPOSER_STORAGE_KEY = "oremea:recognition:composer:v1";

function RecognitionDots() {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="status"
      aria-label="Recognition is responding"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className="h-2 w-2 animate-bounce rounded-full bg-current"
          style={{
            animationDelay: `${index * 120}ms`,
            animationDuration: "700ms",
          }}
        />
      ))}
    </span>
  );
}

function readStoredComposer(): StoredRecognitionComposer | null {
  try {
    const raw = window.localStorage.getItem(COMPOSER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRecognitionComposer>;
    if (typeof parsed.draft !== "string") return null;
    return {
      draft: parsed.draft,
      clientMessageId:
        typeof parsed.clientMessageId === "string"
          ? parsed.clientMessageId
          : null,
    };
  } catch {
    return null;
  }
}

function storeComposer(draft: string, clientMessageId: string | null) {
  try {
    window.localStorage.setItem(
      COMPOSER_STORAGE_KEY,
      JSON.stringify({ draft, clientMessageId }),
    );
  } catch {
    // Local draft protection is best-effort; the database remains authoritative.
  }
}

function clearStoredComposer() {
  try {
    window.localStorage.removeItem(COMPOSER_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions in privacy-hardened browsers.
  }
}

function mergeMessages(
  current: RecognitionChatMessage[],
  incoming: RecognitionChatMessage[],
) {
  const byTurn = new Map<number, RecognitionChatMessage>();
  for (const message of current) byTurn.set(message.turnIndex, message);
  for (const message of incoming) byTurn.set(message.turnIndex, message);
  return [...byTurn.values()].sort((a, b) => a.turnIndex - b.turnIndex);
}

export default function RecognitionChat({
  firstName,
  initialMessages,
}: {
  firstName: string | null;
  initialMessages: RecognitionChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [composerHydrated, setComposerHydrated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const lastMessage = messages.at(-1) ?? null;
  const savedTurnAwaitingReply =
    lastMessage?.role === "user" && lastMessage.clientMessageId
      ? lastMessage
      : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    const stored = readStoredComposer();
    if (stored?.clientMessageId) {
      const matchingSavedTurn = initialMessages.find(
        (message) => message.clientMessageId === stored.clientMessageId,
      );
      if (matchingSavedTurn) {
        clearStoredComposer();
      } else if (!savedTurnAwaitingReply) {
        setDraft(stored.draft);
        setPendingMessageId(stored.clientMessageId);
      }
    } else if (stored?.draft && !savedTurnAwaitingReply) {
      setDraft(stored.draft);
    }

    setComposerHydrated(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
    // Initial server state is intentionally read once; later message changes are local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!composerHydrated || savedTurnAwaitingReply) return;
    if (draft) {
      storeComposer(draft, pendingMessageId);
    } else if (!pendingMessageId) {
      clearStoredComposer();
    }
  }, [composerHydrated, draft, pendingMessageId, savedTurnAwaitingReply]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 224)}px`;
  }, [draft, savedTurnAwaitingReply]);

  function restoreDifferentStoredComposer(completedClientMessageId: string) {
    const stored = readStoredComposer();
    if (
      stored?.draft &&
      stored.clientMessageId !== completedClientMessageId
    ) {
      setDraft(stored.draft);
      setPendingMessageId(stored.clientMessageId);
      return;
    }
    clearStoredComposer();
    setDraft("");
    setPendingMessageId(null);
  }

  async function startNewChat() {
    if (isSending || isStartingNewChat) return;

    if (messages.length > 0) {
      const confirmed = window.confirm(
        "Begin a new chat? This conversation will stay in your Archive.",
      );
      if (!confirmed) return;
    }

    setIsStartingNewChat(true);
    setError("");

    try {
      const response = await fetch("/api/recognition/thread", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Recognition could not begin a new chat just now.",
        );
      }

      clearStoredComposer();
      window.location.assign("https://recognition.oremea.com/begin");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Recognition could not begin a new chat just now.",
      );
      setIsStartingNewChat(false);
    }
  }

  async function sendMessage(savedTurn?: RecognitionChatMessage) {
    const content = savedTurn ? savedTurn.content : draft.trim();
    if (!content || isSending || isStartingNewChat) return;

    const clientMessageId =
      savedTurn?.clientMessageId ?? pendingMessageId ?? crypto.randomUUID();
    if (!clientMessageId) return;

    if (!savedTurn) {
      setPendingMessageId(clientMessageId);
      storeComposer(draft, clientMessageId);
    }

    setIsSending(true);
    setError("");

    try {
      const response = await fetch("/api/recognition/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, clientMessageId }),
      });
      const data = await response.json();

      if (!response.ok || !data?.messages?.user || !data?.messages?.assistant) {
        if (data?.saved && data?.message) {
          setMessages((current) =>
            mergeMessages(current, [data.message as RecognitionChatMessage]),
          );
          setDraft("");
          setPendingMessageId(null);
          clearStoredComposer();
        }
        throw new Error(data?.error || "Recognition could not respond just now.");
      }

      setMessages((current) =>
        mergeMessages(current, [
          data.messages.user as RecognitionChatMessage,
          data.messages.assistant as RecognitionChatMessage,
        ]),
      );

      if (savedTurn) {
        restoreDifferentStoredComposer(clientMessageId);
      } else {
        setDraft("");
        setPendingMessageId(null);
        clearStoredComposer();
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Recognition could not respond just now.",
      );
    } finally {
      setIsSending(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-zinc-100">
      <MemberNav />

      {messages.length > 0 ? (
        <div className="relative z-20 mx-auto flex w-full max-w-4xl justify-end px-5 pt-3 md:px-8">
          <button
            type="button"
            onClick={() => void startNewChat()}
            disabled={isSending || isStartingNewChat}
            className="text-xs uppercase tracking-[0.16em] text-zinc-500 transition hover:text-[#e7c98b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isStartingNewChat ? "Starting…" : "New chat"}
          </button>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-[150px] top-[65px] z-0 flex items-center justify-center"
      >
        <div
          className="h-[220px] w-[min(82vw,680px)] bg-contain bg-center bg-no-repeat opacity-[0.08] sm:h-[260px]"
          style={{ backgroundImage: "url('/images/recognition-logo.webp')" }}
        />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-65px)] max-w-4xl flex-col px-5 md:px-8">
        <div
          className={
            messages.length === 0
              ? "py-4 md:py-5"
              : "flex-1 py-8 md:py-12"
          }
        >
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl py-2 md:py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[#b79a63]">
                Begin where you are
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-zinc-100 md:text-6xl">
                {firstName
                  ? `${firstName}, what has your attention?`
                  : "What has your attention?"}
              </h1>
              <p className="mt-4 max-w-xl font-serif text-xl leading-8 text-zinc-400">
                Bring what is here. Recognition stays with what you actually say,
                remembers your own earlier words when they matter, and does not
                decide where the conversation has to go.
              </p>
            </div>
          ) : (
            <div className="space-y-8 md:space-y-10">
              {messages.map((message) => (
                <article
                  key={message.turnIndex}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-2xl"
                      : "mr-auto max-w-3xl"
                  }
                >
                  <p
                    className={`mb-2 text-[11px] uppercase tracking-[0.2em] ${
                      message.role === "user"
                        ? "text-right text-zinc-600"
                        : "text-[#9d8659]"
                    }`}
                  >
                    {message.role === "user" ? "You" : "Recognition"}
                  </p>
                  <div
                    className={
                      message.role === "user"
                        ? "whitespace-pre-wrap rounded-[1.6rem] border border-white/[0.08] bg-zinc-900 px-5 py-4 text-base leading-7 text-zinc-200 md:px-6 md:text-lg"
                        : "whitespace-pre-wrap border-l border-[#6f5a31] pl-5 font-serif text-xl leading-9 text-[#e6dfd2] md:pl-7 md:text-2xl md:leading-10"
                    }
                  >
                    {message.content}
                  </div>
                </article>
              ))}

              {isSending ? (
                <article className="mr-auto max-w-3xl">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#9d8659]">
                    Recognition
                  </p>
                  <div className="border-l border-[#6f5a31] py-1 pl-5 text-zinc-500 md:pl-7">
                    <RecognitionDots />
                  </div>
                </article>
              ) : null}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 z-20 -mx-5 border-t border-white/[0.06] bg-[#090909]/95 px-5 pb-5 pt-4 backdrop-blur-xl md:-mx-8 md:px-8 md:pb-7">
          <div className="mx-auto max-w-4xl">
            {error ? (
              <div className="mb-3 rounded-2xl border border-[#5c4433] bg-[#17110d] px-4 py-3 text-sm leading-6 text-[#d7b49a]">
                {error}
              </div>
            ) : null}

            {savedTurnAwaitingReply ? (
              <div className="flex flex-col gap-3 rounded-[1.75rem] border border-[#4f4229] bg-[#11100d] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-zinc-400">
                  Your words are saved. Recognition can continue from exactly here.
                </p>
                <button
                  type="button"
                  onClick={() => void sendMessage(savedTurnAwaitingReply)}
                  disabled={isSending || isStartingNewChat}
                  aria-label={
                    isSending
                      ? "Recognition is responding"
                      : "Continue reflection"
                  }
                  className="shrink-0 rounded-full border border-[#b39558] bg-[#b39558] px-5 py-2 text-sm font-medium text-black transition hover:bg-[#c9aa69] disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600"
                >
                  Continue reflection
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.75rem] border border-[#4f4229] bg-[#11100d] p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.25)] focus-within:border-[#9f8148]">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (pendingMessageId) setPendingMessageId(null);
                    if (error) setError("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={3}
                  maxLength={8000}
                  disabled={isSending || isStartingNewChat}
                  placeholder="Say what is here…"
                  style={{ backgroundColor: "transparent" }}
                  className="max-h-56 min-h-[84px] w-full appearance-none resize-none rounded-[1.35rem] border-0 bg-transparent px-4 py-3 font-serif text-lg leading-8 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-60 md:text-xl"
                />
                <div className="flex items-center justify-end px-3 pb-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={
                      isSending ||
                      isStartingNewChat ||
                      draft.trim().length === 0
                    }
                    aria-label={
                      isSending
                        ? "Recognition is responding"
                        : pendingMessageId
                          ? "Retry reflection"
                          : "Reflect"
                    }
                    className="min-w-[82px] rounded-full border border-[#b39558] bg-[#b39558] px-5 py-2 text-sm font-medium text-black transition hover:bg-[#c9aa69] disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600"
                  >
                    {isSending ? "Reflect" : pendingMessageId ? "Retry" : "Reflect"}
                  </button>
                </div>
              </div>
            )}

            <p className="mt-3 text-center text-[11px] leading-5 text-zinc-600">
              Recognition can challenge a distinction in your own words. It does
              not diagnose you, decide another person’s motives, or choose your
              next move.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
