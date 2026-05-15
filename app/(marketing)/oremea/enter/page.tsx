"use client";

import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { Playfair_Display } from "next/font/google";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState, useTransition } from "react";
import { getEntryResumeState, upsertEntryLead } from "./actions";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const RESONANCE_PAYSTACK_URL = "https://paystack.shop/pay/194owb7fjf";
const MIRROR_PAYSTACK_URL = "https://paystack.shop/pay/wx9avyp3-t";

type Plan = "resonance" | "mirror";

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export default function OremeaEnterPage() {
  const { user, isLoaded } = useUser();

  const [firstName, setFirstName] = useState("");
  const [source, setSource] = useState("ghl");
  const [isCheckingState, setIsCheckingState] = useState(false);

  const [, startSavingLead] = useTransition();
  const leadUpsertedRef = useRef(false);

  const signedInEmail =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
    "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const name = params.get("name")?.trim() || "";
    
// 👀🔄TEMP: source tracking reversed for launch
// 🚨🔄TODO: fix after GHL link update

const rawSource = params.get("source")?.trim();

const incomingSource =
  rawSource === "ghl"
    ? "organic"   // reversed
    : rawSource || "ghl"; // default goes to ghl

// 👀🔄TEMP: source tracking reversed for launch
// 🚨🔄TODO: fix after GHL link update

    setFirstName(name);
    setSource(incomingSource);
  }, []);

  useEffect(() => {
    if (!isLoaded || !user || !signedInEmail || leadUpsertedRef.current) return;

    leadUpsertedRef.current = true;
    setIsCheckingState(true);

    startSavingLead(async () => {
      await upsertEntryLead({
        email: signedInEmail,
        firstName: firstName || undefined,
        source: source || undefined,
      });

      const resume = await getEntryResumeState({
        email: signedInEmail,
      });

      if (resume.destination === "journey") {
  window.location.href = "/journey";
  return;
}

if (resume.destination === "begin") {
  window.location.href = "/oremea/begin";
  return;
}

setIsCheckingState(false);
    });
  }, [isLoaded, user, signedInEmail, firstName, source]);

  function buildReturnToSelf() {
    return "/oremea/enter";
  }

  function buildPaystackHref(plan: Plan) {
  const params = new URLSearchParams();

  if (firstName) params.set("name", firstName);
  if (signedInEmail) params.set("email", signedInEmail);
  if (source) params.set("source", source);
  params.set("plan", plan);

  if (process.env.NEXT_PUBLIC_DEV_PAY === "true") {
    return `/oremea/begin?payment=success&plan=${plan}`;
  }

  const baseUrl =
    plan === "mirror" ? MIRROR_PAYSTACK_URL : RESONANCE_PAYSTACK_URL;

  // 🔥 CRITICAL FIX
  params.set(
    "redirect_url",
    `${window.location.origin}/oremea/begin?payment=success&plan=${plan}`
  );

  return `${baseUrl}?${params.toString()}`;
}

  const returnToSelf = buildReturnToSelf();
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(returnToSelf)}`;
  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(returnToSelf)}`;

  if (!isLoaded) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-black text-white">
        <LoadingDots />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-x-hidden overflow-y-auto text-white">
<SiteNav />
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
            style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
          />
          <div
            className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
            style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="mx-auto h-16 w-auto md:h-24"
          />

          <p className="mt-8 text-sm uppercase tracking-[0.32em] text-[#f1dfb4]/80 md:text-base">
            Resonance by Oremea
          </p>

          <h1
            className={`${playfair.className} mt-4 text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl`}
          >
            Begin with an account.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-200 md:text-lg">
            Create an account or sign in first so your payment, progress, and
            reflections stay attached to you.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={signUpHref}
              className="rounded-xl border border-[#c8a96a]/60 px-6 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
            >
              Sign up
            </a>

            <a
              href={signInHref}
              className="rounded-xl border border-white/15 px-6 py-3 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
            >
              Sign in
            </a>
          </div>
        </div>
<div className="relative z-10">
  <SiteFooter />
</div>
      </main>
    );
  }

  if (isCheckingState) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-black text-white">
        <LoadingDots />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
<SiteNav />

      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
          style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="mx-auto max-w-3xl text-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="mx-auto h-16 w-auto md:h-24"
          />

          <p className="mt-8 text-sm uppercase tracking-[0.32em] text-[#f1dfb4]/80 md:text-base">
            Resonance by Oremea
          </p>

          <h1
  className={`${playfair.className} mt-4 text-4xl font-semibold leading-[0.95] tracking-tight md:text-6xl md:leading-[0.95]`}
>
  See what keeps repeating — one day at a time.
</h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-200 md:text-lg">
            Resonance is a structured reflection system designed to help your
            patterns become visible over time.
          </p>

        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-[2px] md:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-[#f1dfb4]/70">
              Option 1
            </p>

            <h2 className={`${playfair.className} mt-3 text-3xl text-white`}>
              Resonance
            </h2>

            <p className="mt-3 text-base leading-7 text-zinc-200">
              The 10-week Resonance journey with daily prompts and two guiding
              questions generated by Mirror.
            </p>

            <ul className="mt-6 space-y-3 text-sm leading-7 text-zinc-300">
              <li>• Full 10-week journey</li>
              <li>• Daily reflection prompts</li>
              <li>• Two guiding questions generated by Mirror</li>
              <li>• Structured awareness process</li>
            </ul>

            <a
              href={buildPaystackHref("resonance")}
              className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
            >
              Start with Resonance
            </a>
          </div>

          <div className="relative flex h-full flex-col rounded-[2rem] border border-[#c8a96a]/60 bg-[#c8a96a]/15 p-6 shadow-[0_0_45px_rgba(200,169,106,0.10)] backdrop-blur-[2px] md:p-8">
  <div className="absolute right-5 top-5 rounded-full border border-[#c8a96a]/40 bg-black/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-[#f1dfb4]/80">
    Deeper clarity
  </div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#f1dfb4]/80">
              Option 2
            </p>

            <h2 className={`${playfair.className} mt-3 text-3xl text-white`}>
              Resonance +{" "}
              <a
  href="#what-mirror-adds"
  onClick={(e) => {
    e.preventDefault();

    const el = document.getElementById("what-mirror-adds");
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    const details = el as HTMLDetailsElement;
    details.open = true;
  }}
  className="italic text-[#C8A96A] hover:underline"
>
  Mirror
</a>
            </h2>

            <p className="mt-3 text-base leading-7 text-zinc-100">
              The full 10-week journey with Mirror active throughout.
            </p>

            <ul className="mt-6 space-y-3 text-sm leading-7 text-zinc-200">
              <li>• Everything in Resonance</li>
              <li>• Full Mirror reflections throughout the journey</li>
              <li>• Pattern synthesis across your responses</li>
              <li>• Two guiding questions included within Mirror</li>
            </ul>

            <a
              href={buildPaystackHref("mirror")}
              className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-[#c8a96a]/70 bg-[#c8a96a]/10 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/20"
            >
              Start with Mirror
            </a>
          </div>
        </section>

        <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-7 text-zinc-300">
          No hidden steps. No forced upgrades. You choose your depth from the
          start.
        </p>

        <section className="mx-auto mt-10 max-w-3xl space-y-4">
          <details className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <summary className="cursor-pointer text-sm text-zinc-100">
              How it works
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-400">
              <p>
                <span className="text-zinc-200">Layer 1:</span> Prompts create
                reflection. You respond to structured prompts that surface
                moments, reactions, and patterns you may not usually stay with.
              </p>
              <p>
                <span className="text-zinc-200">Layer 2:</span> Questions
                create depth. At the end of each day, guiding questions help you
                stay with what you noticed and see it more clearly.
              </p>
              <p>
                <span className="text-zinc-200">Layer 3:</span> Mirror reveals
                patterns. Across your responses, Mirror reflects what repeats,
                what shifts, and what may be forming beneath the surface.
              </p>
            </div>
          </details>

          <details
            id="what-mirror-adds"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-black/30 p-5"
          >
            <summary className="cursor-pointer text-sm text-zinc-100">
              What Mirror adds
            </summary>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              You can reflect for weeks and still miss the pattern.

Not because you’re unaware — but because you’re inside it.

Mirror steps outside your individual answers, and looks across them.

It tracks what repeats:
how you interpret people, what you tolerate, where you override yourself, when you pull closer or step away. 

Not once — but over time.

What feels like separate moments begins to reveal a structure.

And once you can see the structure, you stop guessing.

Each Mirror reflection also generates two precise questions based on your own responses — not generic prompts — designed to take you directly into the pattern that’s forming.

Without Mirror, you reflect on moments.

With Mirror, you start to see the pattern shaping your experience.

And once you see it clearly, you can’t unsee it.

Most people write.
Very few ever see the pattern they’re writing.

Choose how deeply you want to see.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <summary className="cursor-pointer text-sm text-zinc-100">
              What this is not
            </summary>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Resonance is not therapy, coaching, diagnosis, medical advice, or
              crisis support. It is a self-led reflection system designed for
              pattern awareness.
            </p>
          </details>
        </section>
<div className="mx-auto mt-10 max-w-2xl text-center">
  <p className="text-base text-zinc-200">
  Most people reflect on what happened.
</p>

<p className="mt-2 text-base text-zinc-200">
  Very few ever see the pattern shaping their relationships.
</p>

  <p className="mt-6 text-2xl leading-8 text-[#C8A96A]">
  Choose how clearly you want to see.
</p>
</div>

      </div>
<div className="relative z-10">
  <SiteFooter />
</div>
    </main>
  );
}