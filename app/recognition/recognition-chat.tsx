"use client";

import { useEffect, useRef, useState } from "react";

export type RecognitionChatMessage = {
  role: "user" | "assistant";
  content: string;
  turnIndex: number;
  createdAt: string;
};

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
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || isSending) return;

    const clientMessageId = pendingMessageId ?? crypto.randomUUID();
    if (!pendingMessageId) setPendingMessageId(clientMessageId);

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
        throw new Error(data?.error || "Recognition could not respond just now.");
      }

      setMessages((current) => [
        ...current,
        data.messages.user as RecognitionChatMessage,
        data.messages.assistant as RecognitionChatMessage,
      ]);
      setDraft("");
      setPendingMessageId(null);
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
    <main className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#090909]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-5 px-5 py-4 md:px-8">
          <div>
            <p className="font-serif text-xl text-[#e7c98b]">Recognition</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Private · ongoing · accountable to your words
            </p>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <a
              href="https://recognition.oremea.com/archive"
              className="text-zinc-400 transition hover:text-[#e7c98b]"
            >
              Archive
            </a>
            <a
              href="https://www.oremea.com"
              className="text-zinc-500 transition hover:text-zinc-200"
            >
              Oremea
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl flex-col px-5 md:px-8">
        <div className="flex-1 py-8 md:py-12">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl py-12 md:py-20">
              <p className="text-xs uppercase tracking-[0.28em] text-[#b79a63]">
                Begin where you are
              </p>
              <h1 className="mt-5 font-serif text-4xl leading-tight text-zinc-100 md:text-6xl">
                {firstName ? `${firstName}, what has your attention?` : "What has your attention?"}
              </h1>
              <p className="mt-7 max-w-xl font-serif text-xl leading-9 text-zinc-400">
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
                  <div className="border-l border-[#6f5a31] pl-5 font-serif text-lg leading-8 text-zinc-500 md:pl-7">
                    Staying with what you wrote…
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

            <div className="rounded-[1.75rem] border border-[#4f4229] bg-[#11100d] p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.25)] focus-within:border-[#9f8148]">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (pendingMessageId) setPendingMessageId(null);
                  if (error) setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={3}
                maxLength={8000}
                disabled={isSending}
                placeholder="Say what is here…"
                className="max-h-56 min-h-[84px] w-full resize-none bg-transparent px-4 py-3 font-serif text-lg leading-8 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-60 md:text-xl"
              />
              <div className="flex items-center justify-between gap-4 px-3 pb-2">
                <p className="text-xs text-zinc-600">
                  Enter to send · Shift + Enter for a new line
                </p>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isSending || draft.trim().length === 0}
                  className="rounded-full border border-[#b39558] bg-[#b39558] px-5 py-2 text-sm font-medium text-black transition hover:bg-[#c9aa69] disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600"
                >
                  {isSending ? "Reading" : pendingMessageId ? "Retry" : "Send"}
                </button>
              </div>
            </div>

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
