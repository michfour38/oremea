import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";

type CompassAccessOfferProps = {
  onFirstMonth: () => void;
};

export function CompassAccessOffer({
  onFirstMonth,
}: CompassAccessOfferProps) {
  const foundingPrice = formatCompassPrice(
    COMPASS_PRICING.foundingPriceCents,
  );
  const standardPrice = formatCompassPrice(
    COMPASS_PRICING.standardPriceCents,
  );

  return (
    <div className="rounded-[2rem] border border-[#2a2418] bg-[#10100f] p-6 text-stone-100">
      <p className="mb-3 text-xs uppercase tracking-[0.34em] text-[#d8b15f]">
        Compass Access
      </p>

      <h1 className="text-2xl font-semibold">
        Enter Compass for one month.
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        Start with one full month of Compass access. No automatic renewal.
        Return, continue discussions, begin new sessions, and review previous
        sessions during your access period.
      </p>

      <button onClick={onFirstMonth} className="primary-button mt-6">
        Enter Compass · {foundingPrice}
      </button>

      <div className="mt-8 border-t border-[#2a2418] pt-6">
        <p className="text-sm font-medium text-stone-200">
          Founding access
        </p>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Your first {COMPASS_PRICING.accessDays} days are {foundingPrice}.
          Standard {COMPASS_PRICING.accessDays}-day access will be {standardPrice}.
          Nothing renews automatically.
        </p>
      </div>
    </div>
  );
}
