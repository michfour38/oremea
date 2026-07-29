"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";

import type { WorksMarketCategory } from "@/lib/works/categories/list-market-categories";

type MarketView = {
  slug: string;
  name: string;
  geographyLabel: string;
  geographyValues: string[];
};

type BridgeQuestion = {
  key: string;
  audience: "FOUNDER" | "PROVIDER" | "AUTHORITY";
  kind: "CHOICE" | "NUMBER" | "TEXT" | "CONFIRMATION";
  prompt: string;
  purpose: string;
  answerField?: string;
  unit?: string;
  choices?: string[];
};

type RouteSummary = {
  id: string;
  status: "VIABLE" | "POTENTIAL" | "INCOMPLETE";
  label: string;
  providerCount: number;
  handoffCount: number;
  sequence: Array<{
    position: number;
    step: string;
    serviceKey: string | null;
    status: "MATCH" | "NO_MATCH" | "UNKNOWN";
    provider: { name: string; slug: string } | null;
    offering: string | null;
    explanation: string;
  }>;
  unresolved: Array<{
    key: string;
    provider: string | null;
    step: string;
    field: string | null;
    message: string;
  }>;
  nextQuestions: BridgeQuestion[];
  gaps: Array<{
    step: string;
    serviceKey: string | null;
    message: string;
  }>;
};

type IntakeState = {
  productDescription: string;
  categoryKey: string;
  stage: string;
  existingAssets: string[];
  requestedServiceKeys: string[];
  targetQuantity: string;
  quantityUnit: string;
  packagingFormat: string;
  halaalRequired: boolean | null;
  locationPreference: string;
  administrativeArea: string;
};

const INITIAL_STATE: IntakeState = {
  productDescription: "",
  categoryKey: "",
  stage: "",
  existingAssets: [],
  requestedServiceKeys: [],
  targetQuantity: "",
  quantityUnit: "UNITS",
  packagingFormat: "",
  halaalRequired: null,
  locationPreference: "PREFER_AREA",
  administrativeArea: "",
};

const STAGES = [
  ["IDEA", "I have the idea"],
  ["FORMULA_READY", "Formula or recipe ready"],
  ["SELF_MAKING", "I make it myself"],
  ["CURRENT_MANUFACTURER", "I use a manufacturer"],
  ["SCALING", "I am scaling"],
] as const;

const ASSETS = [
  ["FORMULA", "Formula / recipe"],
  ["PROTOTYPE", "Prototype / sample"],
  ["INGREDIENTS", "Ingredients / materials"],
  ["PACKAGING", "Packaging"],
  ["BRANDING", "Branding / artwork"],
  ["TESTING", "Testing"],
  ["CERTIFICATIONS", "Certifications"],
  ["REGULATORY", "Regulatory work"],
  ["ORDERS", "Customer orders"],
] as const;

const SERVICES = [
  ["PRODUCT_DEVELOPMENT", "Develop the product"],
  ["FORMULATION", "Formulation / recipe work"],
  ["TESTING", "Testing / analysis"],
  ["REGULATORY_SUPPORT", "Compliance help"],
  ["RAW_MATERIAL_SOURCING", "Source ingredients / materials"],
  ["MANUFACTURING", "Manufacture it"],
  ["PACKAGING_SUPPLY", "Source packaging"],
  ["PACKAGING", "Fill / pack the product"],
  ["PRINTING", "Labels / printed packaging"],
  ["WAREHOUSING", "Warehousing"],
  ["FULFILMENT", "Fulfilment"],
  ["LOGISTICS", "Logistics"],
] as const;

const PACKAGING_BY_CATEGORY: Record<string, string[]> = {
  FOOD: ["BOTTLE", "JAR", "SACHET", "POUCH", "CAN", "TIN", "BOX", "TUB", "OTHER"],
  BEVERAGE: ["BOTTLE", "CAN", "SACHET", "POUCH", "OTHER"],
  SKINCARE: ["BOTTLE", "JAR", "TUBE", "DROPPER", "PUMP", "SPRAY", "SACHET", "OTHER"],
  PERSONAL_CARE: ["BOTTLE", "JAR", "TUBE", "PUMP", "SPRAY", "SACHET", "POUCH", "OTHER"],
  SUPPLEMENTS: ["BOTTLE", "JAR", "POUCH", "SACHET", "CAPSULE", "BLISTER_PACK", "DROPPER", "OTHER"],
};

const QUANTITY_UNITS = [
  ["UNITS", "units"],
  ["KG", "kg"],
  ["LITRES", "litres"],
  ["BATCH", "batches"],
] as const;

const CHOICE_LABELS: Record<string, string> = {
  EXACT: "Exactly this quantity",
  APPROXIMATE: "Roughly this quantity",
  AT_LEAST: "At least this quantity",
  MAXIMUM: "This is my maximum",
  ANY_RECOGNISED_CURRENT_CERTIFICATION: "Any recognised current certification",
  SPECIFIC_AUTHORITY_REQUIRED: "A specific authority is required",
  UNSURE: "I am not sure yet",
};

function pretty(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function optionClass(active: boolean) {
  return `rounded-full border px-4 py-2.5 text-left text-sm transition ${
    active
      ? "border-[#1f1c17] bg-[#1f1c17] text-white"
      : "border-black/15 bg-white/55 text-[#29261f] hover:border-black/35 hover:bg-white"
  }`;
}

export function FounderConversation({
  market,
  categories,
}: {
  market: MarketView;
  categories: WorksMarketCategory[];
}) {
  const [form, setForm] = useState<IntakeState>(INITIAL_STATE);
  const [panel, setPanel] = useState(0);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [answeringKey, setAnsweringKey] = useState<string | null>(null);
  const [bridgeAnswers, setBridgeAnswers] = useState<Record<string, string | boolean>>({});

  const asksHalaal = ["FOOD", "BEVERAGE", "SUPPLEMENTS"].includes(form.categoryKey);

  const panels = useMemo(
    () => [
      "product",
      "category",
      "stage",
      "assets",
      "services",
      "quantity",
      "packaging",
      ...(asksHalaal ? ["halaal"] : []),
      "location",
    ],
    [asksHalaal]
  );

  const current = panels[panel];
  const packagingOptions =
    PACKAGING_BY_CATEGORY[form.categoryKey] ?? ["BOTTLE", "JAR", "POUCH", "BOX", "OTHER"];

  const categoryName = categories.find((category) => category.key === form.categoryKey)?.name;
  const stageName = STAGES.find(([key]) => key === form.stage)?.[1];
  const assetLabels = ASSETS.filter(([key]) => form.existingAssets.includes(key)).map(([, label]) => label);
  const serviceLabels = SERVICES.filter(([key]) => form.requestedServiceKeys.includes(key)).map(([, label]) => label);

  const answers: Record<string, { question: string; answer: string }> = {
    product: {
      question: "What are you trying to make?",
      answer: form.productDescription,
    },
    category: {
      question: "Which category fits best?",
      answer: categoryName ?? "",
    },
    stage: {
      question: "Where are you with it now?",
      answer: stageName ?? "",
    },
    assets: {
      question: "What do you already have?",
      answer: assetLabels.length > 0 ? assetLabels.join(" · ") : "Nothing yet",
    },
    services: {
      question: "What help are you looking for?",
      answer: serviceLabels.length > 0 ? serviceLabels.join(" · ") : "Show me what comes next",
    },
    quantity: {
      question: "What size first run are you thinking about?",
      answer: form.targetQuantity ? `${form.targetQuantity} ${form.quantityUnit.toLowerCase()}` : "",
    },
    packaging: {
      question: "What format should it leave production in?",
      answer: form.packagingFormat ? pretty(form.packagingFormat) : "",
    },
    halaal: {
      question: "Does Halaal certification matter for this product?",
      answer: form.halaalRequired === null ? "" : form.halaalRequired ? "Yes, required" : "No",
    },
    location: {
      question: "How much does location matter?",
      answer:
        form.locationPreference === "ANYWHERE_MARKET"
          ? `Anywhere in ${market.name}`
          : form.administrativeArea
            ? `${form.locationPreference === "MUST_AREA" ? "Must be" : "Prefer"} · ${form.administrativeArea}`
            : "",
    },
  };

  function canContinue() {
    switch (current) {
      case "product":
        return form.productDescription.trim().length >= 3;
      case "category":
        return Boolean(form.categoryKey);
      case "stage":
        return Boolean(form.stage);
      case "assets":
      case "services":
        return true;
      case "quantity":
        return Number(form.targetQuantity) > 0 && Boolean(form.quantityUnit);
      case "packaging":
        return Boolean(form.packagingFormat);
      case "halaal":
        return form.halaalRequired !== null;
      case "location":
        return form.locationPreference === "ANYWHERE_MARKET" || Boolean(form.administrativeArea);
      default:
        return false;
    }
  }

  async function continueFlow() {
    if (!canContinue()) {
      setError("Add enough detail for WORKS to keep going.");
      return;
    }

    setError("");
    if (panel < panels.length - 1) {
      setPanel((value) => value + 1);
      return;
    }

    await buildRoute();
  }

  async function buildRoute() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/works/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketSlug: market.slug,
          productDescription: form.productDescription,
          categoryKey: form.categoryKey,
          stage: form.stage,
          existingAssets: form.existingAssets,
          requestedServiceKeys: form.requestedServiceKeys,
          targetQuantity: Number(form.targetQuantity),
          quantityUnit: form.quantityUnit,
          packagingFormat: form.packagingFormat,
          halaalRequired: form.halaalRequired === true,
          locationPreference: form.locationPreference,
          administrativeArea:
            form.locationPreference === "ANYWHERE_MARKET" ? undefined : form.administrativeArea,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not build this route.");

      setBriefId(data.briefId);
      setRoute(data.route ?? null);
      setRouteError(data.routeError ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not build this route.");
    } finally {
      setLoading(false);
    }
  }

  async function answerFounderQuestion(question: BridgeQuestion) {
    if (!briefId || !question.answerField) return;
    const value = bridgeAnswers[question.key];
    if (value === undefined || value === "") {
      setError("Add an answer first.");
      return;
    }

    try {
      setAnsweringKey(question.key);
      setError("");
      const response = await fetch(`/api/works/briefs/${briefId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: question.answerField, value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save that answer.");
      setRoute(data.route ?? null);
      setRouteError(data.routeError ?? null);
      setBridgeAnswers((currentAnswers) => {
        const next = { ...currentAnswers };
        delete next[question.key];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save that answer.");
    } finally {
      setAnsweringKey(null);
    }
  }

  function reset() {
    setForm(INITIAL_STATE);
    setPanel(0);
    setBriefId(null);
    setRoute(null);
    setRouteError(null);
    setError("");
    setBridgeAnswers({});
  }

  const confirmedProviders = new Set(
    route?.sequence
      .filter((item) => item.provider && item.status === "MATCH")
      .map((item) => item.provider!.slug) ?? []
  );
  const possibleProviders = new Set(
    route?.sequence
      .filter(
        (item) => item.provider && item.status === "UNKNOWN" && !confirmedProviders.has(item.provider.slug)
      )
      .map((item) => item.provider!.slug) ?? []
  );

  function WorksHeader() {
    return (
      <header className="flex items-center justify-between border-b border-black/10 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8b6a31]">WORKS</p>
          <p className="mt-1 text-xs text-black/40">by Oremea · {market.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-full border border-black/15 bg-white/55 px-4 py-2 text-sm text-[#1f1c17] transition hover:bg-white"
              >
                My WORKS
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className="text-xs uppercase tracking-[0.16em] text-black/40">My WORKS</span>
            <UserButton afterSignOutUrl={`/works/${market.slug}`} />
          </SignedIn>
        </div>
      </header>
    );
  }

  if (briefId) {
    const founderQuestions = route?.nextQuestions.filter((question) => question.audience === "FOUNDER") ?? [];
    const externalQuestions = route?.nextQuestions.filter((question) => question.audience !== "FOUNDER") ?? [];

    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <WorksHeader />

        <div className="py-10 md:py-14">
          <p className="text-sm text-black/45">{route?.label ?? "Production route"}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#1f1c17] md:text-6xl">
            {form.productDescription}
          </h1>

          {route ? (
            <>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-black/60">
                {confirmedProviders.size > 0 ? (
                  <span className="rounded-full border border-black/10 bg-white/55 px-4 py-2">
                    {confirmedProviders.size} confirmed fit{confirmedProviders.size === 1 ? "" : "s"}
                  </span>
                ) : null}
                {possibleProviders.size > 0 ? (
                  <span className="rounded-full border border-black/10 bg-white/55 px-4 py-2">
                    {possibleProviders.size} possible fit{possibleProviders.size === 1 ? "" : "s"}
                  </span>
                ) : null}
                {route.gaps.length > 0 ? (
                  <span className="rounded-full border border-black/10 bg-white/55 px-4 py-2">
                    {route.gaps.length} open step{route.gaps.length === 1 ? "" : "s"}
                  </span>
                ) : null}
                <span className="rounded-full border border-black/10 bg-white/55 px-4 py-2">
                  {route.handoffCount} hand-off{route.handoffCount === 1 ? "" : "s"}
                </span>
              </div>

              <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-black/10 bg-white/65">
                {route.sequence.map((item, index) => (
                  <div
                    key={`${item.position}-${item.step}`}
                    className={`grid gap-3 px-6 py-6 md:grid-cols-[48px_1fr_1fr] md:px-8 ${
                      index > 0 ? "border-t border-black/8" : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1c17] text-xs text-white">
                      {item.position}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-black/40">{item.step}</p>
                      <p className="mt-2 text-lg font-medium text-[#1f1c17]">
                        {item.provider?.name ?? "Still open"}
                      </p>
                    </div>
                    <div className="text-sm leading-6 text-black/55 md:text-right">
                      {item.offering ? <p>{item.offering}</p> : null}
                      <p className="mt-1">
                        {item.provider
                          ? item.status === "MATCH"
                            ? "Confirmed fit"
                            : "Possible fit · needs confirmation"
                          : "Needs a provider"}
                      </p>
                    </div>
                  </div>
                ))}
              </section>

              {founderQuestions.length > 0 ? (
                <section className="mt-10 rounded-[1.5rem] border border-[#8b6a31]/25 bg-[#f8f0df] p-6 md:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">A little more from you</p>
                  <div className="mt-6 space-y-7">
                    {founderQuestions.map((question) => {
                      const value = bridgeAnswers[question.key];
                      return (
                        <div key={question.key} className="border-t border-[#8b6a31]/15 pt-6 first:border-0 first:pt-0">
                          <p className="text-lg font-medium text-[#1f1c17]">{question.prompt}</p>
                          {question.kind === "CHOICE" ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {(question.choices ?? []).map((choice) => (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() =>
                                    setBridgeAnswers((answers) => ({ ...answers, [question.key]: choice }))
                                  }
                                  className={optionClass(value === choice)}
                                >
                                  {CHOICE_LABELS[choice] ?? pretty(choice)}
                                </button>
                              ))}
                            </div>
                          ) : question.kind === "CONFIRMATION" ? (
                            <div className="mt-4 flex gap-2">
                              {[true, false].map((choice) => (
                                <button
                                  key={String(choice)}
                                  type="button"
                                  onClick={() =>
                                    setBridgeAnswers((answers) => ({ ...answers, [question.key]: choice }))
                                  }
                                  className={optionClass(value === choice)}
                                >
                                  {choice ? "Yes" : "No"}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4 flex max-w-md items-center gap-3">
                              <input
                                type={question.kind === "NUMBER" ? "number" : "text"}
                                min={question.kind === "NUMBER" ? 1 : undefined}
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) =>
                                  setBridgeAnswers((answers) => ({
                                    ...answers,
                                    [question.key]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#1f1c17] outline-none focus:border-[#8b6a31]"
                              />
                              {question.unit ? <span className="text-sm text-black/45">{question.unit.toLowerCase()}</span> : null}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => answerFounderQuestion(question)}
                            disabled={answeringKey === question.key}
                            className="mt-4 rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white disabled:opacity-50"
                          >
                            {answeringKey === question.key ? "Recalculating…" : "Update route →"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {externalQuestions.length > 0 ? (
                <section className="mt-10">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">What still needs confirming</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {externalQuestions.map((question) => (
                      <article key={question.key} className="rounded-[1.25rem] border border-black/10 bg-white/55 p-5">
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8b6a31]">
                          {question.audience === "PROVIDER" ? "Ask provider" : "Verify with authority"}
                        </span>
                        <p className="mt-3 text-sm font-medium leading-6 text-[#1f1c17]">{question.prompt}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {route.gaps.length > 0 ? (
                <section className="mt-10 rounded-[1.5rem] border border-dashed border-black/15 p-6">
                  <p className="text-sm font-medium text-[#1f1c17]">Open route gaps</p>
                  {route.gaps.map((gap) => (
                    <p key={gap.step} className="mt-2 text-sm text-black/55">
                      {gap.step}: {gap.message}
                    </p>
                  ))}
                </section>
              ) : null}
            </>
          ) : (
            <div className="mt-10 rounded-[1.5rem] border border-black/10 bg-white/65 p-7">
              <h2 className="font-serif text-2xl text-[#1f1c17]">We haven&apos;t found enough current matches yet.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
                {routeError ?? "WORKS can keep looking for suitable providers for this brief."}
              </p>
            </div>
          )}

          {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

          <button type="button" onClick={reset} className="mt-10 text-sm text-black/45 underline underline-offset-4">
            Start another product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <WorksHeader />

      <main className="py-10 md:py-14">
        <div className="space-y-7">
          {panels.slice(0, panel).map((key, index) => {
            const entry = answers[key];
            if (!entry?.answer) return null;
            return (
              <button
                key={`${key}-${index}`}
                type="button"
                onClick={() => {
                  setError("");
                  setPanel(index);
                }}
                className="group block w-full border-b border-black/8 pb-5 text-left"
              >
                <span className="block text-sm text-black/40">{entry.question}</span>
                <span className="mt-1 block text-lg text-[#1f1c17] group-hover:underline group-hover:underline-offset-4">
                  {entry.answer}
                </span>
              </button>
            );
          })}

          <section className="pt-2">
            {current === "product" ? (
              <>
                <h1 className="font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">What are you trying to make?</h1>
                <textarea
                  autoFocus
                  rows={3}
                  value={form.productDescription}
                  onChange={(event) => setForm((value) => ({ ...value, productDescription: event.target.value }))}
                  placeholder="A chilli sauce from my family recipe…"
                  className="mt-7 w-full resize-none rounded-2xl border border-black/12 bg-white/45 px-5 py-4 text-xl leading-8 text-[#1f1c17] outline-none placeholder:text-black/20 focus:border-[#8b6a31]"
                />
              </>
            ) : null}

            {current === "category" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">Which category fits best?</h1>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setForm((value) => ({ ...value, categoryKey: category.key }))}
                      className={optionClass(form.categoryKey === category.key)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {current === "stage" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">Where are you with it now?</h1>
                <div className="mt-7 flex flex-wrap gap-2">
                  {STAGES.map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setForm((value) => ({ ...value, stage: key }))} className={optionClass(form.stage === key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {current === "assets" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">What do you already have?</h1>
                <div className="mt-7 flex flex-wrap gap-2">
                  {ASSETS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((value) => ({ ...value, existingAssets: toggle(value.existingAssets, key) }))}
                      className={optionClass(form.existingAssets.includes(key))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {current === "services" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">What help are you looking for?</h1>
                <div className="mt-7 flex flex-wrap gap-2">
                  {SERVICES.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((value) => ({ ...value, requestedServiceKeys: toggle(value.requestedServiceKeys, key) }))}
                      className={optionClass(form.requestedServiceKeys.includes(key))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-black/40">Leave it blank and WORKS will show what comes next.</p>
              </>
            ) : null}

            {current === "quantity" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">What size first run are you thinking about?</h1>
                <div className="mt-7 flex max-w-xl gap-3">
                  <input
                    type="number"
                    min={1}
                    value={form.targetQuantity}
                    onChange={(event) => setForm((value) => ({ ...value, targetQuantity: event.target.value }))}
                    placeholder="500"
                    className="min-w-0 flex-1 rounded-2xl border border-black/12 bg-white/55 px-5 py-4 text-xl text-[#1f1c17] outline-none focus:border-[#8b6a31]"
                  />
                  <select
                    value={form.quantityUnit}
                    onChange={(event) => setForm((value) => ({ ...value, quantityUnit: event.target.value }))}
                    className="rounded-2xl border border-black/12 bg-white/55 px-4 py-4 text-sm text-[#1f1c17] outline-none focus:border-[#8b6a31]"
                  >
                    {QUANTITY_UNITS.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            {current === "packaging" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">What format should it leave production in?</h1>
                <div className="mt-7 flex flex-wrap gap-2">
                  {packagingOptions.map((format) => (
                    <button key={format} type="button" onClick={() => setForm((value) => ({ ...value, packagingFormat: format }))} className={optionClass(form.packagingFormat === format)}>
                      {pretty(format)}
                    </button>
                  ))}
                  <button type="button" onClick={() => setForm((value) => ({ ...value, packagingFormat: "UNSURE" }))} className={optionClass(form.packagingFormat === "UNSURE")}>
                    Not sure yet
                  </button>
                </div>
              </>
            ) : null}

            {current === "halaal" ? (
              <>
                <h1 className="font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">Does Halaal certification matter for this product?</h1>
                <div className="mt-7 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setForm((value) => ({ ...value, halaalRequired: true }))} className={optionClass(form.halaalRequired === true)}>Yes, required</button>
                  <button type="button" onClick={() => setForm((value) => ({ ...value, halaalRequired: false }))} className={optionClass(form.halaalRequired === false)}>No</button>
                </div>
              </>
            ) : null}

            {current === "location" ? (
              <>
                <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">How much does location matter?</h1>
                <div className="mt-7 flex flex-wrap gap-2">
                  {[
                    ["ANYWHERE_MARKET", `Anywhere in ${market.name}`],
                    ["PREFER_AREA", `Prefer my ${market.geographyLabel.toLowerCase()}`],
                    ["MUST_AREA", `Must be in my ${market.geographyLabel.toLowerCase()}`],
                  ].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setForm((value) => ({ ...value, locationPreference: key }))} className={optionClass(form.locationPreference === key)}>{label}</button>
                  ))}
                </div>
                {form.locationPreference !== "ANYWHERE_MARKET" ? (
                  <select
                    value={form.administrativeArea}
                    onChange={(event) => setForm((value) => ({ ...value, administrativeArea: event.target.value }))}
                    className="mt-5 w-full max-w-md rounded-2xl border border-black/12 bg-white/55 px-4 py-4 text-sm text-[#1f1c17] outline-none focus:border-[#8b6a31]"
                  >
                    <option value="">Choose {market.geographyLabel.toLowerCase()}</option>
                    {market.geographyValues.map((area) => <option key={area} value={area}>{area}</option>)}
                  </select>
                ) : null}
              </>
            ) : null}

            {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

            <div className="mt-9 flex justify-end">
              <button
                type="button"
                onClick={continueFlow}
                disabled={loading}
                className="rounded-full bg-[#1f1c17] px-7 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
              >
                {loading ? "Building your route…" : panel === panels.length - 1 ? "Build my route →" : "Continue →"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
