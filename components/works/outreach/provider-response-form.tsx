"use client";

import { useState } from "react";

export function ProviderResponseForm({
  token,
  preview = false,
}: {
  token?: string;
  preview?: boolean;
}) {
  const [decision, setDecision] = useState("");
  const [moqValue, setMoqValue] = useState("");
  const [moqUnit, setMoqUnit] = useState("UNITS");
  const [leadTime, setLeadTime] = useState("");
  const [capacityDate, setCapacityDate] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [certificationNotes, setCertificationNotes] = useState("");
  const [providerNotes, setProviderNotes] = useState("");
  const [status, setStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");
  const [error, setError] = useState("");

  async function submit() {
    if (preview || !token) return;

    try {
      setStatus("SAVING");
      setError("");
      const response = await fetch(`/api/works/provider-outreach/respond/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          moqValue,
          moqUnit,
          leadTime,
          capacityDate,
          pricingNotes,
          certificationNotes,
          providerNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save this response.");
      setStatus("SAVED");
    } catch (err) {
      setStatus("IDLE");
      setError(err instanceof Error ? err.message : "WORKS could not save this response.");
    }
  }

  if (status === "SAVED") {
    return (
      <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 text-sm leading-6">
        Thank you. Your response has been added to this production brief and is now visible to the WORKS customer.
      </div>
    );
  }

  const optionClass = (value: string) =>
    `rounded-full border px-4 py-2.5 text-sm ${decision === value ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white text-[#1f1c17]"}`;

  return (
    <div className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-6 md:p-8">
      <h2 className="font-serif text-2xl">Can you take this part of the route?</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setDecision("YES")} className={optionClass("YES")}>Yes</button>
        <button type="button" onClick={() => setDecision("POSSIBLE")} className={optionClass("POSSIBLE")}>Possibly — I need more information</button>
        <button type="button" onClick={() => setDecision("OUTSIDE_CAPABILITY")} className={optionClass("OUTSIDE_CAPABILITY")}>Outside our capability</button>
      </div>

      {decision && decision !== "OUTSIDE_CAPABILITY" ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="text-sm">Minimum order quantity
            <div className="mt-1 flex gap-2">
              <input type="number" min={0} value={moqValue} onChange={(event) => setMoqValue(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-black/10 px-4 py-3" />
              <input value={moqUnit} onChange={(event) => setMoqUnit(event.target.value)} placeholder="units / kg / litres" className="w-32 rounded-xl border border-black/10 px-3 py-3" />
            </div>
          </label>
          <label className="text-sm">Estimated lead time
            <input value={leadTime} onChange={(event) => setLeadTime(event.target.value)} placeholder="e.g. 4–6 weeks" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3" />
          </label>
          <label className="text-sm">Capacity available from
            <input type="date" value={capacityDate} onChange={(event) => setCapacityDate(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3" />
          </label>
          <label className="text-sm">Pricing / quote notes
            <input value={pricingNotes} onChange={(event) => setPricingNotes(event.target.value)} placeholder="What is needed to quote?" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3" />
          </label>
          <label className="text-sm md:col-span-2">Certifications or compliance relevant to this brief
            <textarea rows={2} value={certificationNotes} onChange={(event) => setCertificationNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3" />
          </label>
        </div>
      ) : null}

      {decision ? (
        <label className="mt-4 block text-sm">Anything the customer should know
          <textarea rows={3} value={providerNotes} onChange={(event) => setProviderNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3" />
        </label>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={!decision || status === "SAVING" || preview}
        onClick={submit}
        className="mt-6 rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {preview
          ? "Preview only · response will not send"
          : status === "SAVING"
            ? "Saving response…"
            : "Send response →"}
      </button>
    </div>
  );
}
