"use client";

import { useState } from "react";

export default function RecognitionThreadControls({
  threadId,
  isActive,
  hasConversation,
}: {
  threadId: string;
  isActive: boolean;
  hasConversation: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!hasConversation) return null;

  async function deleteConversation() {
    const confirmed = window.confirm(
      isActive
        ? "Delete this current Recognition chat? This cannot be undone."
        : "Delete this archived Recognition chat? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/recognition/thread", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: "delete-recognition-conversation",
          threadId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Recognition could not delete this chat just now.");
      }

      window.location.assign(
        isActive
          ? "https://recognition.oremea.com/begin"
          : "https://recognition.oremea.com/archive",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Recognition could not delete this chat just now.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <section className="rec-user-bubble mt-10 rounded-[2rem] border p-6 md:p-8">
      <p className="rec-accent text-xs uppercase tracking-[0.22em]">
        Delete chat
      </p>
      <h2 className="rec-text mt-2 font-serif text-2xl">
        Delete this conversation
      </h2>
      <p className="rec-text mt-4 max-w-2xl text-sm leading-7">
        This removes only this Recognition chat and its messages. Other chats in
        your Archive stay exactly where they are.
      </p>

      {error ? (
        <p className="rec-error-panel mt-5 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isDeleting}
        onClick={() => void deleteConversation()}
        className="rec-text mt-6 rounded-full border border-[var(--recognition-user-border)] px-5 py-2.5 text-sm transition hover:border-[var(--recognition-composer-focus)] hover:text-[var(--recognition-gold)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isDeleting ? "Deleting…" : "Delete this chat"}
      </button>
    </section>
  );
}
