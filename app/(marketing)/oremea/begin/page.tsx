"use client";

import { Playfair_Display } from "next/font/google";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  getEntryResumeState,
  grantJourneyAccess,
  markIntroCompleted,
} from "../enter/actions";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

type PanelProps = {
  title?: string;
  body?: string;
  children?: ReactNode;
  className?: string;
};

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

function PanelShell({ title, body, children, className = "" }: PanelProps) {
  return (
    <section
      className={`flex h-[100svh] w-screen shrink-0 items-center justify-center px-6 pb-10 pt-28 text-white md:px-6 md:pb-20 md:pt-28 ${className}`}
    >
      <div
        className="relative z-10 w-full"
        style={{
          width: "min(calc(100svh * 1024 / 1820), 92vw)",
          maxWidth: "620px",
        }}
      >
        {title ? (
          <h1
            className={`${playfair.className} text-[2rem] font-semibold leading-[0.95] tracking-tight text-white md:text-5xl`}
          >
            {title}
          </h1>
        ) : null}

        {body ? (
          <p className="mt-4 max-w-[34rem] whitespace-pre-wrap text-[1.02rem] leading-8 text-zinc-200 md:text-base md:leading-8">
            {body}
          </p>
        ) : null}

        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

export default function OremeaBeginPage() {
  const { user, isLoaded } = useUser();

  const signedInEmail =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
    "";

  const [index, setIndex] = useState(0);
  const [reflection, setReflection] = useState("");
  const [savedReflection, setSavedReflection] = useState("");
const [isSaving, setIsSaving] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
const [isCompletingIntro, setIsCompletingIntro] = useState(false);
  const [accessResolved, setAccessResolved] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user || !signedInEmail) {
      window.location.href = "/oremea/enter";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const paymentValue = params.get("payment")?.trim() || "";
    const paymentSuccess = paymentValue.startsWith("success");

    let cancelled = false;

    async function resolveAccess() {
      if (paymentSuccess) {
        const access = await grantJourneyAccess({
          email: signedInEmail,
        });

        if (cancelled) return;

        if (access.hasAccess) {
          setHasAccess(true);
          setAccessResolved(true);
          return;
        }

        setHasAccess(false);
        setAccessResolved(true);
        return;
      }

      const resume = await getEntryResumeState({
        email: signedInEmail,
      });

      if (cancelled) return;

      if (resume.destination === "journey") {
        window.location.href = "/journey";
        return;
      }

      if (resume.destination === "begin") {
        setHasAccess(true);
        setAccessResolved(true);
        return;
      }

      window.location.href = "/oremea/enter";
    }

    resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, signedInEmail]);

  const previewResponse = useMemo(() => {
    const text = savedReflection.trim();

    if (!text) {
      return "Save your reflection first. Then Resonance will reflect back what it is already hearing in your words.";
    }

    const cleanText = text.length > 180 ? `${text.slice(0, 180).trim()}…` : text;

    if (text.length < 25) {
      return `You wrote: “${cleanText}”

Even in a short answer, there is something useful here. Resonance will not force meaning onto it. It will begin by staying close to what you actually gave — the hesitation, the simplicity, or even the uncertainty. Sometimes “I don’t know” is not nothing. It is the first honest place to begin.`;
    }

    if (text.length < 80) {
      return `You wrote: “${cleanText}”

What is already coming through is not a finished answer, but a starting signal. There is something in this reflection that points to where your attention is currently resting. As you continue, Resonance will help you notice whether this becomes a repeating pattern, a protective response, a longing, or something in you beginning to shift.`;
    }

    return `You wrote: “${cleanText}”

What I’m already hearing is that something in this reflection matters enough to be named. There may be a thread here around what you are ready to understand more clearly — not by rushing toward an answer, but by watching what repeats, what softens, and what becomes more honest over time.

This is the beginning point Resonance will carry forward.`;
  }, [savedReflection]);

  const canMoveForward = (() => {
    if (index === 4) return savedReflection.trim().length > 0;
    return index < 5;
  })();

  function goPrev() {
    setIndex((v) => Math.max(0, v - 1));
  }

  function goNext() {
    if (!canMoveForward || isEntering) return;
    setIndex((v) => Math.min(5, v + 1));
  }

  async function handleSaveBeginReflection() {
  const text = reflection.trim();
  if (!text || isSaving) return;

  setIsSaving(true);

  // simulate processing / synthesis feel
  await new Promise((resolve) => setTimeout(resolve, 800));

  setSavedReflection(text);
  setIsSaving(false);
}

  async function handleEnterResonance() {
  if (!signedInEmail || isCompletingIntro) return;

  setIsCompletingIntro(true);

  await markIntroCompleted({
    email: signedInEmail,
  });

  window.location.href = "/journey";
}

  const panels = [
    <PanelShell
      key="p1"
      title="Return to what is already within you."
      body={`This is not something you learn.
It is something that becomes visible — over time.`}
    />,
    <PanelShell
      key="p2"
      title="How Resonance unfolds."
      body={`Over the next few weeks:
You will respond to a few prompts per day.
You will be guided through questions that help you stay with what appears.
Over time, what repeats begins to reveal itself.`}
    />,
    <PanelShell
      key="p3"
      title="Not advice. Not noise. Not another feed."
      body={`Resonance does not tell you who you are.
It does not diagnose, coach, or correct you.
It gives structure to your own reflections — so you can begin to see what is already there.`}
    />,
    <PanelShell
      key="p4"
      title="Begin with what feels true."
      body={`What feels most true about where you are right now?
Not what sounds right.
Not what you think it should be.
What is actually there.`}
    >
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={5}
        className="w-full resize-none rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#c8a96a]/30"
        placeholder="Write what feels true..."
      />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSaveBeginReflection}
          disabled={!reflection.trim()}
          className={`rounded-xl border px-5 py-3 text-sm transition ${
            savedReflection
              ? "border-[#c8a96a]/60 bg-[#c8a96a]/10 text-[#f1dfb4]"
              : reflection.trim()
                ? "border-[#c8a96a]/60 bg-transparent text-[#f1dfb4] hover:bg-[#c8a96a]/10"
                : "border-white/15 bg-transparent text-white/35"
          }`}
        >
          {isSaving ? <LoadingDots /> : savedReflection ? "Reflection saved" : "Save reflection"}
        </button>
      </div>
    </PanelShell>,
    <PanelShell key="p5" title="What I’m already hearing">
      <div className="space-y-5">
        <p className="whitespace-pre-wrap text-base leading-8 text-zinc-200">
          {previewResponse}
        </p>
      </div>
    </PanelShell>,
    <PanelShell key="p6" title="Enter Resonance">
      <div className="space-y-5">
        <p className="text-base leading-8 text-zinc-200">
          You’ve placed your first reflection into the system.
        </p>

        <p className="text-base leading-8 text-zinc-200">
          From here, Resonance continues through structured prompts, guiding
          questions, and pattern recognition over time.
        </p>

        <p className="text-base leading-8 text-zinc-300">
          You don’t need to figure everything out. You only need to stay with
          what appears.
        </p>

        <button
          type="button"
          onClick={handleEnterResonance}
          disabled={isCompletingIntro || !hasAccess}
          className={`inline-flex min-w-[170px] items-center justify-center rounded-xl border px-5 py-3 text-sm transition ${
            !isEntering && hasAccess
              ? "border-[#c8a96a]/60 bg-transparent text-[#f1dfb4] hover:bg-[#c8a96a]/10"
              : "border-white/15 bg-transparent text-white/35"
          }`}
        >
          {isCompletingIntro ? <LoadingDots /> : "Enter Resonance"}
        </button>

        {accessResolved && !hasAccess ? (
          <p className="text-sm leading-7 text-white/60">
            Your payment has returned, but journey access has not attached yet.
            Stay on this page for now — do not repay.
          </p>
        ) : null}
      </div>
    </PanelShell>,
  ];

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null) return;
    const currentX = e.touches[0]?.clientX ?? 0;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  }

  function handleTouchEnd() {
    const delta = touchDeltaXRef.current;

    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  }

  if (!accessResolved) {
    return (
      <main className="relative h-[100svh] overflow-hidden text-white">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
            style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
          />
          <div
            className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
            style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 flex h-[100svh] items-center justify-center px-6">
          <div className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm text-white/70">
            <LoadingDots />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-[100svh] overflow-hidden text-white">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
          style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="pointer-events-none fixed left-1/2 top-3 z-20 -translate-x-1/2 text-center md:top-5">
        <div
          className="flex flex-col items-center"
          style={{
            width: "min(calc(100svh * 1024 / 1820), 92vw)",
            maxWidth: "620px",
          }}
        >
          <div className="mb-1.5 flex items-center justify-center gap-4 text-[#C8A96A]">
            <span className="text-xs leading-none md:text-sm">✦</span>
            <span className="text-xs leading-none md:text-sm">✦</span>
            <span className="text-xs leading-none md:text-sm">✦</span>
          </div>

          <h1
            className={`${playfair.className} leading-none tracking-tight`}
            style={{
              fontSize: "clamp(1.35rem, 3vw, 3.2rem)",
              textShadow: "0 0 16px rgba(0,0,0,0.28)",
            }}
          >
            <span className="text-white">Reso</span>
            <span
              className="italic text-[#C8A96A]"
              style={{
                textShadow: "0 0 8px rgba(200, 169, 106, 0.16)",
              }}
            >
              nance
            </span>
          </h1>

          <p
            className="mt-1.5 uppercase"
            style={{
              fontSize: "clamp(0.52rem, 0.8vw, 0.68rem)",
              letterSpacing: "0.28em",
              color: "rgba(255,255,255,0.62)",
            }}
          >
            by Oremea
          </p>
        </div>
      </div>

      <div
        className="relative z-10 flex h-[100svh] transition-transform duration-500 ease-out"
        style={{
          width: `${panels.length * 100}vw`,
          transform: `translateX(-${index * 100}vw)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {panels}
      </div>

      {index > 0 && (
        <button
          onClick={goPrev}
          className="fixed left-1/2 top-1/2 z-20 hidden -translate-y-1/2 md:flex"
          style={{ transform: "translate(calc(-50% - 330px), -50%)" }}
          aria-label="Previous"
        >
          <span className="text-4xl text-white/60 transition hover:text-white">
            ←
          </span>
        </button>
      )}

      {index < panels.length - 1 && (
        <button
          onClick={goNext}
          className="fixed left-1/2 top-1/2 z-20 hidden -translate-y-1/2 md:flex"
          style={{ transform: "translate(calc(-50% + 330px), -50%)" }}
          aria-label="Next"
        >
          <span
            className={`text-4xl transition ${
              canMoveForward && !isEntering
                ? "text-white/60 hover:text-white"
                : "text-white/20"
            }`}
          >
            →
          </span>
        </button>
      )}

      <div className="pointer-events-none fixed bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {panels.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition ${
              i === index ? "bg-[#f1dfb4]" : "bg-white/20"
            }`}
          />
        ))}
      </div>
<footer className="fixed bottom-3 left-1/2 z-20 w-full -translate-x-1/2 px-4 text-center text-[11px] text-white/40">
  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
    <a href="/terms" className="hover:text-white/60">
      Terms
    </a>
    <span>·</span>
    <a href="/privacy" className="hover:text-white/60">
      Privacy
    </a>
    <span>·</span>
    <a href="/disclaimer" className="hover:text-white/60">
      Disclaimer
    </a>
    <span>·</span>
    <a href="/refunds" className="hover:text-white/60">
      Refunds
    </a>
    <span>·</span>
    <a href="/conduct" className="hover:text-white/60">
      Conduct
    </a>
  </div>
</footer>
    </main>
  );
}