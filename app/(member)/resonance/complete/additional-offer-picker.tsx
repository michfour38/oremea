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
      <div className="res-accent-border res-panel rounded-3xl border p-7">
        <p className="res-accent text-xs uppercase tracking-[0.22em]">Recommended</p>
        <h2 className="res-text mt-3 text-2xl">Complete ten</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Add now</p>
            <p className="res-text-primary mt-1 text-xl">{completeQuantity} visits</p>
          </div>
          <div>
            <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Pay now</p>
            <p className="res-text-primary mt-1 text-xl">{formatOremeaPrice(completeAmountCents)}</p>
          </div>
          <div>
            <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Result</p>
            <p className="res-text-primary mt-1 text-xl">10 visits total</p>
          </div>
        </div>

        <p className="res-text-primary mt-5 text-sm leading-7">
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
            className="res-text-primary res-accent-hover mt-5 w-full text-center text-sm underline underline-offset-4"
          >
            {showFewer ? "Hide fewer visits" : "Choose fewer visits"}
          </button>
        ) : null}
      </div>

      {showFewer && selected ? (
        <div className="res-border res-panel mt-4 rounded-3xl border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="res-text-secondary text-xs uppercase tracking-[0.2em]">Fewer visits</p>
              <h3 className="res-text mt-2 text-xl">Compare a smaller addition</h3>
              <p className="res-text-secondary mt-2 text-sm leading-6">
                {rangeLabel}. The complete-ten offer remains above so the comparison stays visible.
              </p>
            </div>

            <div className="res-border res-panel-soft flex items-center gap-3 rounded-full border px-3 py-2">
              <button
                type="button"
                onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
                disabled={selectedIndex === 0}
                aria-label="Choose fewer additional visits"
                className="res-border res-text-primary h-9 w-9 rounded-full border text-lg disabled:opacity-30"
              >
                −
              </button>
              <span className="res-text min-w-20 text-center text-lg">{selected.quantity}</span>
              <button
                type="button"
                onClick={() => setSelectedIndex((index) => Math.min(smallerOffers.length - 1, index + 1))}
                disabled={selectedIndex === smallerOffers.length - 1}
                aria-label="Choose more additional visits"
                className="res-border res-text-primary h-9 w-9 rounded-full border text-lg disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div>
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Add</p>
              <p className="res-text-primary mt-1 text-lg">{selected.quantity} visits</p>
            </div>
            <div>
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Pay now</p>
              <p className="res-text-primary mt-1 text-lg">{formatOremeaPrice(selected.amountCents)}</p>
            </div>
            <div>
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">New total</p>
              <p className="res-text-primary mt-1 text-lg">{finalVisitCount} visits</p>
            </div>
            <div>
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Overall rate</p>
              <p className="res-text-primary mt-1 text-lg">{formatOremeaPrice(finalPerVisitCents)}/visit</p>
            </div>
          </div>

          <form action={addVisits} className="mt-6">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="quantity" value={selected.quantity} />
            <button
              type="submit"
              disabled={!canCharge}
              className="res-secondary-action w-full rounded-xl border px-5 py-3 text-base transition disabled:cursor-not-allowed disabled:opacity-50"
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
          className="res-text-primary res-accent-hover w-full py-2 text-center text-sm underline underline-offset-4"
        >
          No thanks · Choose my room
        </button>
      </form>
    </section>
  );
}
