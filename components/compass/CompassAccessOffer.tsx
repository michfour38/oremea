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
  const monthlyPrice = formatCompassPrice(
    COMPASS_PRICING.launchPriceCents,
  );

  return (
    <div className="rounded-[2rem] border border-[#2a2418] bg-[#10100f] p-6 text-stone-100">
      <p className="mb-3 text-xs uppercase tracking-[0.34em] text-[#d8b15f]">
        Compass Access
      </p>

      <h1 className="text-2xl font-semibold">
        Enter Compass month to month.
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        Compass is {monthlyPrice} per month and can be cancelled anytime. Return,
        continue discussions, begin new sessions, and keep what you complete in
        your Archive after cancellation.
      </p>

      <button onClick={onFirstMonth} className="primary-button mt-6">
        Enter Compass · {monthlyPrice}/month
      </button>

      <div className="mt-8 border-t border-[#2a2418] pt-6">
        <p className="text-sm font-medium text-stone-200">
          Monthly membership
        </p>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {monthlyPrice} per month. Cancel anytime. Your saved Compass Archive
          remains yours after the membership ends.
        </p>
      </div>
    </div>
  );
}
