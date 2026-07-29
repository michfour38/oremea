"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export function CompassCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const isResumeCard = title === "Resume Compass?";
  const childArray = Children.toArray(children);
  const [hasGoalSet, setHasGoalSet] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    if (!isResumeCard) return;

    let cancelled = false;

    fetch("/api/compass/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const goals = data?.session?.area_responses;
        setHasGoalSet(Array.isArray(goals) && goals.length >= 8);
      })
      .catch(() => {});

    if (window.location.hash === "#resume-current-goals") {
      const resumeButton = childArray[0];

      if (
        isValidElement<{ onClick?: () => void }>(resumeButton) &&
        typeof resumeButton.props.onClick === "function"
      ) {
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${window.location.search}`,
        );

        window.setTimeout(() => {
          resumeButton.props.onClick?.();
        }, 0);
      }
    }

    return () => {
      cancelled = true;
    };
    // The resume children are stable for the lifetime of this card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResumeCard]);

  async function startNewConversation() {
    if (startingConversation) return;

    setStartingConversation(true);
    setResumeError("");

    try {
      const response = await fetch("/api/compass/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "new_discussion" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResumeError(
          data?.error ?? "Compass could not start a new conversation yet.",
        );
        return;
      }

      window.location.assign("/compass#resume-current-goals");
    } catch {
      setResumeError("Compass could not start a new conversation yet.");
    } finally {
      setStartingConversation(false);
    }
  }

  const visibleDescription = isResumeCard
    ? "Compass found an active session. Continue where you left off, begin a fresh conversation with your current goals, or set new goals."
    : description;

  const secondResumeChild = childArray[1];
  const relabelledSecondChild =
    isResumeCard && isValidElement(secondResumeChild)
      ? cloneElement(secondResumeChild, undefined, "Set new goals")
      : secondResumeChild;

  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-[#0f0f0f]/96 p-6 shadow-2xl shadow-black/30 backdrop-blur">
      {eyebrow && (
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
          {eyebrow}
        </p>
      )}

      <h1 className="font-serif text-3xl text-[#d8b15f] sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400 sm:text-base">
        {visibleDescription}
      </p>

      <div className="mt-6 space-y-4">
        {isResumeCard ? (
          <>
            {childArray[0]}

            {hasGoalSet ? (
              <button
                type="button"
                onClick={() => void startNewConversation()}
                disabled={startingConversation}
                className="secondary-button disabled:cursor-wait disabled:opacity-60"
              >
                {startingConversation
                  ? "Opening new conversation..."
                  : "Start a new conversation with my current goals"}
              </button>
            ) : null}

            {relabelledSecondChild}
            {childArray.slice(2)}

            {resumeError ? (
              <p className="text-sm leading-6 text-amber-200/80">{resumeError}</p>
            ) : null}
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
