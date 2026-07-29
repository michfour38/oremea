"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

type MapReviewState = {
  reviewed: boolean;
  activeCount: number;
};

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
  const isDiscussionCard = title === "Discussion";
  const isMapCard = title === "Map";
  const childArray = Children.toArray(children);
  const cardRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [hasGoalSet, setHasGoalSet] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [mapReview, setMapReview] = useState<MapReviewState | null>(null);
  const [confirmingMap, setConfirmingMap] = useState(false);
  const [mapReviewError, setMapReviewError] = useState("");

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

  useEffect(() => {
    if (!isDiscussionCard) return;

    const timeout = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [isDiscussionCard, children]);

  useEffect(() => {
    if (!isMapCard) return;

    void loadMapReview();
    const refresh = window.setTimeout(() => void loadMapReview(), 1000);

    return () => window.clearTimeout(refresh);
  }, [isMapCard]);

  async function loadMapReview() {
    try {
      const response = await fetch("/api/compass/ending", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data?.state?.mapItems)
        ? data.state.mapItems
        : [];
      const activeCount = items.filter(
        (item: { status?: string }) =>
          item?.status === "active" || item?.status === "waiting",
      ).length;

      setMapReview({
        reviewed: data?.state?.mapReviewed === true,
        activeCount,
      });
    } catch {
      // The Map itself remains available if review-state refresh pauses.
    }
  }

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

  async function confirmMap() {
    if (confirmingMap) return;

    setConfirmingMap(true);
    setMapReviewError("");

    try {
      const response = await fetch("/api/compass/ending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "confirm_map" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMapReviewError(
          data?.error ?? "Compass could not confirm the Map yet.",
        );
        return;
      }

      setMapReview((current) => ({
        reviewed: true,
        activeCount:
          current?.activeCount ??
          (Array.isArray(data?.state?.mapItems)
            ? data.state.mapItems.filter(
                (item: { status?: string }) =>
                  item?.status === "active" || item?.status === "waiting",
              ).length
            : 0),
      }));
    } catch {
      setMapReviewError("Compass could not confirm the Map yet.");
    } finally {
      setConfirmingMap(false);
    }
  }

  function handleCardClickCapture(event: MouseEvent<HTMLElement>) {
    if (!isMapCard) return;

    const target = event.target as HTMLElement;
    const button = target.closest("button");
    const label = button?.textContent?.trim() ?? "";

    if (label === "Edit" || label === "Release") {
      window.setTimeout(() => void loadMapReview(), 900);
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

  const showMapReview =
    isMapCard && mapReview && mapReview.activeCount > 0 && !mapReview.reviewed;

  return (
    <>
      <section
        ref={cardRef}
        onClickCapture={handleCardClickCapture}
        className="rounded-[2rem] border border-zinc-800 bg-[#0f0f0f]/96 p-6 shadow-2xl shadow-black/30 backdrop-blur"
      >
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

        {showMapReview ? (
          <section className="mt-6 rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
              Review your Map
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Check that each item says what you mean. Edit the wording or release
              anything that overlaps before Compass turns this Map into movement.
            </p>
          </section>
        ) : null}

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
                <p className="text-sm leading-6 text-amber-200/80">
                  {resumeError}
                </p>
              ) : null}
            </>
          ) : (
            children
          )}

          {showMapReview ? (
            <button
              type="button"
              onClick={() => void confirmMap()}
              disabled={confirmingMap}
              className="primary-button disabled:cursor-wait disabled:opacity-60"
            >
              {confirmingMap ? "Confirming Map..." : "Confirm this Map"}
            </button>
          ) : null}

          {isMapCard && mapReview?.reviewed ? (
            <p className="text-center text-xs uppercase tracking-[0.16em] text-zinc-500">
              Map confirmed
            </p>
          ) : null}

          {mapReviewError ? (
            <p className="text-sm leading-6 text-amber-200/80">
              {mapReviewError}
            </p>
          ) : null}

          {isDiscussionCard ? <div ref={bottomRef} aria-hidden="true" /> : null}
        </div>
      </section>

      {isDiscussionCard ? (
        <button
          type="button"
          aria-label="Back to top of Discussion"
          title="Back to top"
          onClick={() =>
            cardRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#d8b15f]/50 bg-[#15110B]/95 text-lg text-[#E7C98B] shadow-lg shadow-black/40 backdrop-blur transition hover:border-[#d8b15f]"
        >
          ↑
        </button>
      ) : null}
    </>
  );
}
