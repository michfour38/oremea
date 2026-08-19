"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { WorksMarketCategory } from "@/lib/works/categories/list-market-categories";
import { ProviderOutreachPanel } from "@/components/works/outreach/provider-outreach-panel";

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

type RouteProvider = {
  id: string;
  name: string;
  slug: string;
  hasEmail: boolean;
  steps: string[];
  offerings: string[];
  outreach: {
    status: string;
    decision: string | null;
    sentAt: string | null;
    respondedAt: string | null;
    moqValue: number | null;
    moqUnit: string | null;
    leadTime: string | null;
    capacityDate: string | null;
    pricingNotes: string | null;
    certificationNotes: string | null;
    providerNotes: string | null;
  } | null;
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
  providers: RouteProvider[];
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

type QuantityBasis =
  | "INDIVIDUALS"
  | "PACKS"
  | "CASES"
  | "BATCHES"
  | "MEASUREMENT";

type IntakeState = {
  productDescription: string;
  categoryKey: string;
  stage: string;
  existingAssets: string[];
  requestedServiceKeys: string[];
  quantityMinimum: string;
  quantityPreferred: string;
  quantityMaximum: string;
  quantityBasis: QuantityBasis;
  quantityBasisAmount: string;
  quantityBasisUnit: string;
  packagingFormat: string;
  packagingOther: string;
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
  quantityMinimum: "",
  quantityPreferred: "",
  quantityMaximum: "",
  quantityBasis: "INDIVIDUALS",
  quantityBasisAmount: "",
  quantityBasisUnit: "UNITS",
  packagingFormat: "",
  packagingOther: "",
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

const QUANTITY_BASES: Array<[QuantityBasis, string]> = [
  ["INDIVIDUALS", "1s"],
  ["PACKS", "Packs"],
  ["CASES", "Cases"],
  ["BATCHES", "Batches"],
  ["MEASUREMENT", "Weight / volume"],
];

const MEASUREMENT_UNITS = [
  ["MG", "mg"],
  ["G", "g"],
  ["KG", "kg"],
  ["ML", "ml"],
  ["LITRES", "litres"],
  ["OZ", "oz"],
  ["LB", "lb"],
  ["FL_OZ_US", "US fl oz"],
  ["GALLON_US", "US gallons"],
  ["FL_OZ_IMPERIAL", "Imperial fl oz"],
  ["GALLON_IMPERIAL", "Imperial gallons"],
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
      : "border-black/15 bg-white/70 text-[#29261f] hover:border-black/35 hover:bg-white"
  }`;
}

function buildPanels(categoryKey: string) {
  const asksHalaal = ["FOOD", "BEVERAGE", "SUPPLEMENTS"].includes(categoryKey);
  return [
    "product",
    "category",
    "stage",
    "assets",
    "services",
    "quantity",
    "packaging",
    ...(asksHalaal ? ["halaal"] : []),
    "location",
  ];
}

function rangeLabel(form: IntakeState) {
  if (!form.quantityMinimum || !form.quantityMaximum) return "";
  const preferred = form.quantityPreferred
    ? ` · preferred ${form.quantityPreferred}`
    : "";

  if (form.quantityBasis === "INDIVIDUALS") {
    return `${form.quantityMinimum}-${form.quantityMaximum} individual units${preferred}`;
  }
  if (form.quantityBasis === "PACKS") {
    return `${form.quantityMinimum}-${form.quantityMaximum} packs × ${form.quantityBasisAmount || "?"} units${preferred}`;
  }
  if (form.quantityBasis === "CASES") {
    return `${form.quantityMinimum}-${form.quantityMaximum} cases × ${form.quantityBasisAmount || "?"} units${preferred}`;
  }
  if (form.quantityBasis === "BATCHES") {
    const unit = MEASUREMENT_UNITS.find(([key]) => key === form.quantityBasisUnit)?.[1] ?? form.quantityBasisUnit;
    return `${form.quantityMinimum}-${form.quantityMaximum} batches × ${form.quantityBasisAmount || "?"} ${unit}${preferred}`;
  }
  const unit = MEASUREMENT_UNITS.find(([key]) => key === form.quantityBasisUnit)?.[1] ?? form.quantityBasisUnit;
  return `${form.quantityMinimum}-${form.quantityMaximum} ${unit}${preferred}`;
}

function storageKey(marketSlug: string) {
  return `oremea:works:${marketSlug}:search-session`;
}

function browserKey(marketSlug: string) {
  return `oremea:works:${marketSlug}:browser-session`;
}

function WorksConversationHeader({ market }: { market: MarketView }) {
  return (
    <header className="flex items-center justify-between border-b border-black/10 pb-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8b6a31]">WORKS</p>
        <p className="mt-1 text-xs text-black/40">by Oremea · {market.name}</p>
      </div>
      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm text-[#1f1c17]">
              My WORKS
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/works/my" className="text-sm text-[#1f1c17] underline-offset-4 hover:underline">My WORKS</Link>
          <UserButton afterSignOutUrl={`/works/${market.slug}`} />
        </SignedIn>
      </div>
    </header>
  );
}

export function FounderConversationV2({
  market,
  categories,
  embedded = false,
}: {
  market: MarketView;
  categories: WorksMarketCategory[];
  embedded?: boolean;
}) {
  const [form, setForm] = useState<IntakeState>(INITIAL_STATE);
  const [panel, setPanel] = useState(0);
  const [furthestPanel, setFurthestPanel] = useState(0);
  const [searchSessionId, setSearchSessionId] = useState<string | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [answeringKey, setAnsweringKey] = useState<string | null>(null);
  const [bridgeAnswers, setBridgeAnswers] = useState<Record<string, string | boolean>>({});
  const [restoring, setRestoring] = useState(true);
  const [lead, setLead] = useState({
    name: "",
    email: "",
    phone: "",
    preferredContactMethod: "EMAIL",
  });
  const [leadStatus, setLeadStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");

  const panels = useMemo(() => buildPanels(form.categoryKey), [form.categoryKey]);
  const safePanel = Math.min(panel, panels.length - 1);
  const safeFurthest = Math.min(furthestPanel, panels.length - 1);
  const current = panels[safePanel];
  const packagingOptions =
    PACKAGING_BY_CATEGORY[form.categoryKey] ?? ["BOTTLE", "JAR", "POUCH", "BOX", "OTHER"];

  useEffect(() => {
    if (panel >= panels.length) setPanel(panels.length - 1);
    if (furthestPanel >= panels.length) setFurthestPanel(panels.length - 1);
  }, [panel, furthestPanel, panels.length]);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const savedSessionId = window.localStorage.getItem(storageKey(market.slug));
        if (!savedSessionId) return;

        const response = await fetch(`/api/works/search-sessions/${savedSessionId}`);
        if (!response.ok) {
          window.localStorage.removeItem(storageKey(market.slug));
          return;
        }

        const data = await response.json();
        if (cancelled) return;

        const answers = data?.answers;
        if (answers && typeof answers === "object" && !Array.isArray(answers)) {
          const restored = { ...INITIAL_STATE, ...answers } as IntakeState;
          setForm(restored);
          const restoredPanels = buildPanels(restored.categoryKey);
          const restoredIndex = data.currentStep
            ? restoredPanels.indexOf(data.currentStep)
            : restoredPanels.length - 1;
          const index = restoredIndex >= 0 ? restoredIndex : 0;
          setPanel(index);
          setFurthestPanel(index);
        }

        setSearchSessionId(savedSessionId);

        if (data?.briefId) {
          const routeResponse = await fetch(
            `/api/works/briefs/${data.briefId}?searchSessionId=${encodeURIComponent(savedSessionId)}`
          );
          if (routeResponse.ok) {
            const routeData = await routeResponse.json();
            if (!cancelled) {
              setBriefId(data.briefId);
              setRoute(routeData.route ?? null);
              setRouteError(routeData.routeError ?? null);
            }
          }
        }
      } catch {
        // A failed restore should never block a fresh anonymous search.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [market.slug]);

  const categoryName = categories.find((category) => category.key === form.categoryKey)?.name;
  const stageName = STAGES.find(([key]) => key === form.stage)?.[1];
  const assetLabels = ASSETS.filter(([key]) => form.existingAssets.includes(key)).map(([, label]) => label);
  const serviceLabels = SERVICES.filter(([key]) => form.requestedServiceKeys.includes(key)).map(([, label]) => label);

  const answers: Record<string, { question: string; answer: string }> = {
    product: { question: "What are you making?", answer: form.productDescription },
    category: { question: "Which category fits best?", answer: categoryName ?? "" },
    stage: { question: "Where are you with it now?", answer: stageName ?? "" },
    assets: {
      question: "What do you already have?",
      answer: assetLabels.length > 0 ? assetLabels.join(" · ") : "Nothing yet",
    },
    services: {
      question: "What help are you looking for?",
      answer: serviceLabels.length > 0 ? serviceLabels.join(" · ") : "Show me what comes next",
    },
    quantity: { question: "What size first run could work?", answer: rangeLabel(form) },
    packaging: {
      question: "What format should it leave production in?",
      answer:
        form.packagingFormat === "OTHER"
          ? form.packagingOther
          : form.packagingFormat
            ? pretty(form.packagingFormat)
            : "",
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
      case "quantity": {
        const minimum = Number(form.quantityMinimum);
        const preferred = form.quantityPreferred ? Number(form.quantityPreferred) : null;
        const maximum = Number(form.quantityMaximum);
        const rangeValid = minimum > 0 && maximum >= minimum &&
          (preferred == null || (preferred >= minimum && preferred <= maximum));
        const basisValid =
          form.quantityBasis === "INDIVIDUALS" ||
          form.quantityBasis === "MEASUREMENT" ||
          Number(form.quantityBasisAmount) > 0;
        return rangeValid && basisValid && Boolean(form.quantityBasisUnit);
      }
      case "packaging":
        return Boolean(form.packagingFormat) &&
          (form.packagingFormat !== "OTHER" || form.packagingOther.trim().length >= 2);
      case "halaal":
        return form.halaalRequired !== null;
      case "location":
        return form.locationPreference === "ANYWHERE_MARKET" || Boolean(form.administrativeArea);
      default:
        return false;
    }
  }

  function browserSessionId() {
    const key = browserKey(market.slug);
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.localStorage.setItem(key, created);
    return created;
  }

  async function saveSearch(currentStep: string | null) {
    if (searchSessionId) {
      const response = await fetch(`/api/works/search-sessions/${searchSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: form, currentStep }),
      });
      if (!response.ok) throw new Error("WORKS could not save this search yet.");
      return searchSessionId;
    }

    const response = await fetch("/api/works/search-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketSlug: market.slug,
        browserSessionId: browserSessionId(),
        answers: form,
        currentStep,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "WORKS could not save this search yet.");
    setSearchSessionId(data.sessionId);
    window.localStorage.setItem(storageKey(market.slug), data.sessionId);
    return data.sessionId as string;
  }

  async function continueFlow() {
    if (!canContinue()) {
      setError("Add enough detail for WORKS to keep going.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (safePanel < safeFurthest) {
        const returnStep = panels[safeFurthest];
        await saveSearch(returnStep);
        setPanel(safeFurthest);
        return;
      }

      if (safePanel < panels.length - 1) {
        const next = safePanel + 1;
        await saveSearch(panels[next]);
        setPanel(next);
        setFurthestPanel(next);
        return;
      }

      await buildRoute();
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save this search yet.");
    } finally {
      setLoading(false);
    }
  }

  async function buildRoute() {
    const sessionId = await saveSearch(null);
    const response = await fetch("/api/works/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchSessionId: sessionId,
        marketSlug: market.slug,
        productDescription: form.productDescription,
        categoryKey: form.categoryKey,
        stage: form.stage,
        existingAssets: form.existingAssets,
        requestedServiceKeys: form.requestedServiceKeys,
        quantityMinimum: Number(form.quantityMinimum),
        quantityPreferred: form.quantityPreferred ? Number(form.quantityPreferred) : undefined,
        quantityMaximum: Number(form.quantityMaximum),
        quantityBasis: form.quantityBasis,
        quantityBasisAmount: form.quantityBasisAmount ? Number(form.quantityBasisAmount) : undefined,
        quantityBasisUnit:
          form.quantityBasis === "INDIVIDUALS" || form.quantityBasis === "PACKS" || form.quantityBasis === "CASES"
            ? "UNITS"
            : form.quantityBasisUnit,
        packagingFormat: form.packagingFormat,
        packagingOther: form.packagingOther,
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

  async function requestSourcing() {
    if (!briefId || !searchSessionId) return;
    try {
      setLeadStatus("SAVING");
      setError("");
      const response = await fetch("/api/works/procurement-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchSessionId,
          briefId,
          ...lead,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save this sourcing request yet.");
      setLeadStatus("SAVED");
    } catch (err) {
      setLeadStatus("IDLE");
      setError(err instanceof Error ? err.message : "WORKS could not save this sourcing request yet.");
    }
  }

  function reset() {
    window.localStorage.removeItem(storageKey(market.slug));
    setForm(INITIAL_STATE);
    setPanel(0);
    setFurthestPanel(0);
    setSearchSessionId(null);
    setBriefId(null);
    setRoute(null);
    setRouteError(null);
    setError("");
    setBridgeAnswers({});
    setLeadStatus("IDLE");
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
  const needsSourcing = !route || route.gaps.length > 0 || confirmedProviders.size === 0;

  if (restoring) {
    return <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8 text-sm text-black/40 md:px-8">Restoring WORKS…</div>;
  }

  if (briefId) {
    const founderQuestions = route?.nextQuestions.filter((question) => question.audience === "FOUNDER") ?? [];
    const externalQuestions = route?.nextQuestions.filter((question) => question.audience !== "FOUNDER") ?? [];

    return (
      <div className={`mx-auto w-full max-w-5xl px-5 md:px-8 ${embedded ? "pb-8 md:pb-12" : "py-8 md:py-12"}`}>
        {embedded ? null : <WorksConversationHeader market={market} />}
        <div className="py-10 md:py-14">
          <p className="text-sm text-black/45">{route?.label ?? "Production route"}</p>
          <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">
            {form.productDescription}
          </h1>

          {route ? (
            <>
              <div className="mt-7 flex flex-wrap gap-2 text-sm text-black/60">
                {confirmedProviders.size > 0 ? <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2">{confirmedProviders.size} confirmed fit{confirmedProviders.size === 1 ? "" : "s"}</span> : null}
                {possibleProviders.size > 0 ? <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2">{possibleProviders.size} possible fit{possibleProviders.size === 1 ? "" : "s"}</span> : null}
                {route.gaps.length > 0 ? <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2">{route.gaps.length} open step{route.gaps.length === 1 ? "" : "s"}</span> : null}
              </div>

              <section className="mt-8 overflow-hidden rounded-3xl border border-black/10 bg-white/70">
                {route.sequence.map((item, index) => (
                  <div key={`${item.position}-${item.step}`} className={`grid gap-3 px-5 py-5 md:grid-cols-[36px_1fr_1fr] md:px-7 ${index > 0 ? "border-t border-black/8" : ""}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1c17] text-xs text-white">{item.position}</div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-black/40">{item.step}</p>
                      <p className="mt-1 text-lg font-medium">{item.provider?.name ?? "Still open"}</p>
                    </div>
                    <div className="text-sm leading-6 text-black/55 md:text-right">
                      {item.offering ? <p>{item.offering}</p> : null}
                      <p>{item.provider ? (item.status === "MATCH" ? "Confirmed fit" : "Possible fit · needs confirmation") : "Needs a provider"}</p>
                    </div>
                  </div>
                ))}
              </section>

              {route.providers.length > 0 ? (
                <ProviderOutreachPanel
                  briefId={briefId}
                  searchSessionId={searchSessionId}
                  providers={route.providers}
                />
              ) : null}

              {founderQuestions.length > 0 ? (
                <section className="mt-8 rounded-3xl border border-[#8b6a31]/20 bg-[#f8f0df] p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">A little more from you</p>
                  <div className="mt-5 space-y-6">
                    {founderQuestions.map((question) => {
                      const value = bridgeAnswers[question.key];
                      return (
                        <div key={question.key} className="border-t border-[#8b6a31]/15 pt-5 first:border-0 first:pt-0">
                          <p className="text-lg font-medium">{question.prompt}</p>
                          {question.kind === "CHOICE" ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(question.choices ?? []).map((choice) => <button key={choice} type="button" onClick={() => setBridgeAnswers((answers) => ({ ...answers, [question.key]: choice }))} className={optionClass(value === choice)}>{CHOICE_LABELS[choice] ?? pretty(choice)}</button>)}
                            </div>
                          ) : question.kind === "CONFIRMATION" ? (
                            <div className="mt-3 flex gap-2">
                              {[true, false].map((choice) => <button key={String(choice)} type="button" onClick={() => setBridgeAnswers((answers) => ({ ...answers, [question.key]: choice }))} className={optionClass(value === choice)}>{choice ? "Yes" : "No"}</button>)}
                            </div>
                          ) : (
                            <div className="mt-3 flex max-w-md items-center gap-3">
                              <input type={question.kind === "NUMBER" ? "number" : "text"} min={question.kind === "NUMBER" ? 1 : undefined} value={typeof value === "string" ? value : ""} onChange={(event) => setBridgeAnswers((answers) => ({ ...answers, [question.key]: event.target.value }))} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]" />
                              {question.unit ? <span className="text-sm text-black/45">{question.unit.toLowerCase()}</span> : null}
                            </div>
                          )}
                          <button type="button" onClick={() => answerFounderQuestion(question)} disabled={answeringKey === question.key} className="mt-3 rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white disabled:opacity-50">{answeringKey === question.key ? "Recalculating…" : "Update route →"}</button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {externalQuestions.length > 0 ? (
                <section className="mt-8">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">What still needs confirming</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {externalQuestions.map((question) => <article key={question.key} className="rounded-2xl border border-black/10 bg-white/60 p-5"><span className="text-[11px] uppercase tracking-[0.15em] text-[#8b6a31]">{question.audience === "PROVIDER" ? "Ask provider" : "Verify with authority"}</span><p className="mt-2 text-sm leading-6">{question.prompt}</p></article>)}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {needsSourcing ? (
            <section data-works-sourcing-fallback className="mt-10 rounded-3xl border border-black/10 bg-white/75 p-6 md:p-8">
              <h2 className="font-serif text-3xl text-[#1f1c17]">We haven&apos;t found enough current matches yet.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">Leave your details and WORKS can continue looking for suitable South African providers for this brief.</p>
              {leadStatus === "SAVED" ? (
                <div className="mt-6 rounded-2xl bg-[#f3eee4] p-5 text-sm leading-6">Got it. Your brief is recorded and WORKS can continue sourcing from here.</div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <input value={lead.name} onChange={(event) => setLead((value) => ({ ...value, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]" />
                  <input type="email" value={lead.email} onChange={(event) => setLead((value) => ({ ...value, email: event.target.value }))} placeholder="Email" className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]" />
                  <input value={lead.phone} onChange={(event) => setLead((value) => ({ ...value, phone: event.target.value }))} placeholder="WhatsApp / phone (optional)" className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]" />
                  <select value={lead.preferredContactMethod} onChange={(event) => setLead((value) => ({ ...value, preferredContactMethod: event.target.value }))} className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]"><option value="EMAIL">Email me</option><option value="WHATSAPP">WhatsApp me</option><option value="PHONE">Phone me</option></select>
                  <div className="md:col-span-2">
                    <button type="button" onClick={requestSourcing} disabled={leadStatus === "SAVING"} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{leadStatus === "SAVING" ? "Saving your brief…" : "Keep looking for me →"}</button>
                    <p className="mt-3 max-w-xl text-xs leading-5 text-black/40">Sending this asks WORKS to continue sourcing suitable providers for this brief and contact you with results.</p>
                  </div>
                </div>
              )}
              {routeError ? <p className="mt-4 text-xs text-black/35">{routeError}</p> : null}
            </section>
          ) : null}

          {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}
          <button type="button" onClick={reset} className="mt-8 text-sm text-black/45 underline underline-offset-4">Start another product</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto min-h-screen w-full max-w-3xl px-5 md:px-8 ${embedded ? "pb-8 md:pb-12" : "py-8 md:py-12"}`}>
      {embedded ? null : <WorksConversationHeader market={market} />}
      <section className="py-10 md:py-14">
        <div className="space-y-4">
          {panels.slice(0, safeFurthest + 1).map((key, index) => {
            const entry = answers[key];
            if (index === safePanel) {
              return (
                <section key={key} className="rounded-3xl border border-black/10 bg-white/55 p-5 shadow-[0_12px_40px_rgba(44,35,20,0.04)] md:p-7">
                  {current === "product" ? (
                    <><h1 className="font-serif text-3xl text-[#1f1c17] md:text-4xl">What are you making?</h1><textarea autoFocus rows={3} value={form.productDescription} onChange={(event) => setForm((value) => ({ ...value, productDescription: event.target.value }))} placeholder="A chilli sauce from my family recipe…" className="mt-5 w-full resize-none rounded-2xl border border-black/12 bg-white px-4 py-4 text-lg leading-7 outline-none placeholder:text-black/20 focus:border-[#8b6a31]" /></>
                  ) : null}

                  {current === "category" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">Which category fits best?</h1><div className="mt-5 flex flex-wrap gap-2">{categories.map((category) => <button key={category.key} type="button" onClick={() => setForm((value) => ({ ...value, categoryKey: category.key }))} className={optionClass(form.categoryKey === category.key)}>{category.name}</button>)}</div></>
                  ) : null}

                  {current === "stage" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">Where are you with it now?</h1><div className="mt-5 flex flex-wrap gap-2">{STAGES.map(([keyValue, label]) => <button key={keyValue} type="button" onClick={() => setForm((value) => ({ ...value, stage: keyValue }))} className={optionClass(form.stage === keyValue)}>{label}</button>)}</div></>
                  ) : null}

                  {current === "assets" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">What do you already have?</h1><div className="mt-5 flex flex-wrap gap-2">{ASSETS.map(([keyValue, label]) => <button key={keyValue} type="button" onClick={() => setForm((value) => ({ ...value, existingAssets: toggle(value.existingAssets, keyValue) }))} className={optionClass(form.existingAssets.includes(keyValue))}>{label}</button>)}</div></>
                  ) : null}

                  {current === "services" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">What help are you looking for?</h1><div className="mt-5 flex flex-wrap gap-2">{SERVICES.map(([keyValue, label]) => <button key={keyValue} type="button" onClick={() => setForm((value) => ({ ...value, requestedServiceKeys: toggle(value.requestedServiceKeys, keyValue) }))} className={optionClass(form.requestedServiceKeys.includes(keyValue))}>{label}</button>)}</div><p className="mt-4 text-sm text-black/40">Leave this blank and WORKS will work out what comes next.</p></>
                  ) : null}

                  {current === "quantity" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">What size first run could work?</h1><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["quantityMinimum", "Minimum"], ["quantityPreferred", "Preferred"], ["quantityMaximum", "Maximum"]].map(([field, label]) => <label key={field} className="text-xs text-black/45">{label}<input type="number" min={1} value={form[field as keyof IntakeState] as string} onChange={(event) => setForm((value) => ({ ...value, [field]: event.target.value }))} placeholder={label === "Preferred" ? "optional" : "0"} className="mt-1 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-lg text-[#1f1c17] outline-none focus:border-[#8b6a31]" /></label>)}</div><p className="mt-5 text-sm text-black/45">How are you counting it?</p><div className="mt-2 flex flex-wrap gap-2">{QUANTITY_BASES.map(([basis, label]) => <button key={basis} type="button" onClick={() => setForm((value) => ({ ...value, quantityBasis: basis, quantityBasisAmount: "", quantityBasisUnit: basis === "INDIVIDUALS" || basis === "PACKS" || basis === "CASES" ? "UNITS" : "KG" }))} className={optionClass(form.quantityBasis === basis)}>{label}</button>)}</div>{form.quantityBasis === "PACKS" || form.quantityBasis === "CASES" ? <label className="mt-5 block max-w-xs text-xs text-black/45">Units in each {form.quantityBasis === "PACKS" ? "pack" : "case"}<input type="number" min={1} value={form.quantityBasisAmount} onChange={(event) => setForm((value) => ({ ...value, quantityBasisAmount: event.target.value, quantityBasisUnit: "UNITS" }))} placeholder={form.quantityBasis === "PACKS" ? "6" : "12"} className="mt-1 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-lg outline-none focus:border-[#8b6a31]" /></label> : null}{form.quantityBasis === "BATCHES" ? <div className="mt-5 flex max-w-md gap-2"><input type="number" min={0.001} step="any" value={form.quantityBasisAmount} onChange={(event) => setForm((value) => ({ ...value, quantityBasisAmount: event.target.value }))} placeholder="Amount in each batch" className="min-w-0 flex-1 rounded-xl border border-black/12 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]" /><select value={form.quantityBasisUnit} onChange={(event) => setForm((value) => ({ ...value, quantityBasisUnit: event.target.value }))} className="rounded-xl border border-black/12 bg-white px-3 py-3 outline-none">{MEASUREMENT_UNITS.map(([unit, label]) => <option key={unit} value={unit}>{label}</option>)}</select></div> : null}{form.quantityBasis === "MEASUREMENT" ? <select value={form.quantityBasisUnit} onChange={(event) => setForm((value) => ({ ...value, quantityBasisUnit: event.target.value }))} className="mt-5 rounded-xl border border-black/12 bg-white px-4 py-3 outline-none">{MEASUREMENT_UNITS.map(([unit, label]) => <option key={unit} value={unit}>{label}</option>)}</select> : null}</>
                  ) : null}

                  {current === "packaging" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">What format should it leave production in?</h1><div className="mt-5 flex flex-wrap gap-2">{packagingOptions.map((format) => <button key={format} type="button" onClick={() => setForm((value) => ({ ...value, packagingFormat: format, packagingOther: format === "OTHER" ? value.packagingOther : "" }))} className={optionClass(form.packagingFormat === format)}>{pretty(format)}</button>)}<button type="button" onClick={() => setForm((value) => ({ ...value, packagingFormat: "UNSURE", packagingOther: "" }))} className={optionClass(form.packagingFormat === "UNSURE")}>Not sure yet</button></div>{form.packagingFormat === "OTHER" ? <input autoFocus value={form.packagingOther} onChange={(event) => setForm((value) => ({ ...value, packagingOther: event.target.value }))} placeholder="Tell us what you are looking for" className="mt-4 w-full max-w-lg rounded-xl border border-black/12 bg-white px-4 py-3 outline-none focus:border-[#8b6a31]" /> : null}</>
                  ) : null}

                  {current === "halaal" ? (
                    <><h1 className="font-serif text-3xl leading-tight md:text-4xl">Does Halaal certification matter for this product?</h1><div className="mt-5 flex gap-2"><button type="button" onClick={() => setForm((value) => ({ ...value, halaalRequired: true }))} className={optionClass(form.halaalRequired === true)}>Yes, required</button><button type="button" onClick={() => setForm((value) => ({ ...value, halaalRequired: false }))} className={optionClass(form.halaalRequired === false)}>No</button></div></>
                  ) : null}

                  {current === "location" ? (
                    <><h1 className="font-serif text-3xl md:text-4xl">How much does location matter?</h1><div className="mt-5 flex flex-wrap gap-2">{[["ANYWHERE_MARKET", `Anywhere in ${market.name}`], ["PREFER_AREA", `Prefer my ${market.geographyLabel.toLowerCase()}`], ["MUST_AREA", `Must be in my ${market.geographyLabel.toLowerCase()}`]].map(([keyValue, label]) => <button key={keyValue} type="button" onClick={() => setForm((value) => ({ ...value, locationPreference: keyValue, administrativeArea: keyValue === "ANYWHERE_MARKET" ? "" : value.administrativeArea }))} className={optionClass(form.locationPreference === keyValue)}>{label}</button>)}</div>{form.locationPreference !== "ANYWHERE_MARKET" ? <select value={form.administrativeArea} onChange={(event) => setForm((value) => ({ ...value, administrativeArea: event.target.value }))} className="mt-4 w-full max-w-md rounded-xl border border-black/12 bg-white px-4 py-3 outline-none"><option value="">Choose {market.geographyLabel.toLowerCase()}</option>{market.geographyValues.map((area) => <option key={area} value={area}>{area}</option>)}</select> : null}</>
                  ) : null}

                  {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}
                  <div className="mt-6 flex justify-end"><button type="button" onClick={continueFlow} disabled={loading} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{loading ? "Saving…" : safePanel === panels.length - 1 && safePanel === safeFurthest ? "Build my route →" : safePanel < safeFurthest ? "Save →" : "Continue →"}</button></div>
                </section>
              );
            }

            if (!entry?.answer) return null;
            return (
              <button key={key} type="button" onClick={() => { setError(""); setPanel(index); }} className="block w-full rounded-2xl px-2 py-3 text-left transition hover:bg-white/40">
                <span className="block text-xs text-black/40">{entry.question}</span>
                <span className="mt-1 block text-base text-[#1f1c17] underline-offset-4 hover:underline">{entry.answer}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
