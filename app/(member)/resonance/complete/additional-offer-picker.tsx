"use client";

import { useMemo, useState } from "react";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { addVisits, skipAddition } from "../visits/actions";
import { VisitSubmitButton } from "../visits/submit-button";

type SmallerOffer = {
  quantity: number;
  amountCents: number;
};

export function AdditionalOfferPicker({
  orderId,
  currentQuantity,
  currentPaidCents,
  completeQuantity,
  completeAmountCents,
  completeTotalCents,
  smallerOffers,
  canCharge,
}: {
  orderId: string;
  currentQuantity: number;
  currentPaidCents: number;
  completeQuantity: number;
  completeAmountCents: number;
  completeTotalCents: number;
  smallerOffers: SmallerOffer[];
  canCharge: boolean;
}) {
  const [showFewer, setShowFewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = smallerOffers[selectedIndex] ?? null;
  const finalVisitCount = selected ? currentQuantity + selected.quantity : currentQuantity;
  const finalPaidCents = selected ? currentPaidCents + selected.amountCents : currentPaidCents;
  const finalPerVisitCents = finalVisitCount > 0 ? Math.round(finalPaidCents / finalVisitCount) : 0;
  const completePerVisitCents = Math.round(completeTotalCents / 10);

  const rangeLabel = useMemo(() => {
    if (!smallerOffers.length) return "";
    const first = smallerOffers[0].quantity;
    const last = smallerOffers[smallerOffers.length - 1].quantity;
    return first === last ? `${first} additional visit` : `${first}–${last} additional visits`;
  }, [smallerOffers]);

  return (
    <section className="mt-8">
      <div className="rounded-3xl border border-[#c8a96a]/50 bg-black/50 p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]/80">Recommended</p>
        <h2 className="mt-3 text-2xl">Complete ten</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Add now</p>
            <p className="mt-1 text-xl text-zinc-100">{completeQuantity} visits</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Pay now</p>
            <p className="mt-1 text-xl text-zinc-100">{formatOremeaPrice(completeAmountCents)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Result</p>
            <p className="mt-1 text-xl text-zinc-100">10 visits total</p>
          </div>
        </div>

        <p className="mt-5 text-lg leading-8 text-zinc-300">
          {formatOremeaPrice(completeTotalCents)} total paid · {formatOremeaPrice(completePerVisitCents)} per visit.
        </p>

        <form action={addVisits} className="mt-6">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="quantity" value={completeQuantity} />
          <VisitSubmitButton disabled={!canCharge}>
            Complete ten · Pay {formatOremeaPrice(completeAmountCents)}
          </VisitSubmitButton>
        </form>

        {smallerOffers.length ? (
          <button
            type="button"
            onClick={() => setShowFewer((value) => !value)}
            aria-expanded={showFewer}
            className="mt-5 w-full text-center text-lg leading-7 text-zinc-200 underline underline-offset-4 hover:text-white"
          >
            {showFewer ? "Hide fewer visits" : "Choose fewer visits"}
          </button>
        ) : null}
      </div>

      {showFewer && selected ? (
        <div className="mt-4 rounded-3xl border border-white/15 bg-black/40 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fewer visits</p>
              <h3 className="mt-2 text-xl text-zinc-100">Compare a smaller addition</h3>
              <p className="mt-2 text-lg leading-8 text-zinc-300">
                {rangeLabel}. Choose the amount that fits.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/30 px-3 py-2">
              <button
                type="button"
                onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
                disabled={selectedIndex === 0}
                aria-label="Choose fewer additional visits"
                className="h-9 w-9 rounded-full border border-white/15 text-lg text-zinc-200 disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-20 text-center text-lg text-white">{selected.quantity}</span>
              <button
                type="button"
                onClick={() => setSelectedIndex((index) => Math.min(smallerOffers.length - 1, index + 1))}
                disabled={selectedIndex === smallerOffers.length - 1}
                aria-label="Choose more additional visits"
                className="h-9 w-9 rounded-full border border-white/15 text-lg text-zinc-200 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Add</p>
              <p className="mt-1 text-lg text-zinc-100">{selected.quantity} visits</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Pay now</p>
              <p className="mt-1 text-lg text-zinc-100">{formatOremeaPrice(selected.amountCents)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">New total</p>
              <p className="mt-1 text-lg text-zinc-100">{finalVisitCount} visits</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Overall rate</p>
              <p className="mt-1 text-lg text-zinc-100">{formatOremeaPrice(finalPerVisitCents)}/visit</p>
            </div>
          </div>

          <form action={addVisits} className="mt-6">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="quantity" value={selected.quantity} />
            <button
              type="submit"
              disabled={!canCharge}
              className="w-full rounded-xl border border-white/25 px-5 py-3 text-base text-zinc-100 transition hover:border-white/40 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add {selected.quantity} visits · Pay {formatOremeaPrice(selected.amountCents)}
            </button>
          </form>
        </div>
      ) : null}

      <form action={skipAddition} className="mt-6">
        <input type="hidden" name="orderId" value={orderId} />
        <button
          type="submit"
          className="w-full py-3 text-center text-lg leading-7 text-zinc-200 underline underline-offset-4 hover:text-white"
        >
          No thanks · Choose my room
        </button>
      </form>
    </section>
  );
}
