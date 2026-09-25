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
    <div className="rounded-[2rem] border border-[var(--compass-map-border)] bg-[var(--compass-surface-strong)] p-6 text-[var(--compass-text)]">
      <p className="comp-accent mb-3 text-xs uppercase tracking-[0.34em]">
        Compass Access
      </p>

      <h1 className="text-2xl font-semibold">
        Enter Compass month to month.
      </h1>

      <p className="comp-text-soft mt-4 text-sm leading-relaxed">
        Compass is {monthlyPrice} per month and can be cancelled anytime. Return,
        continue discussions, begin new sessions, and keep what you complete in
        your Archive after cancellation.
      </p>

      <button onClick={onFirstMonth} className="primary-button mt-6">
        Enter Compass · {monthlyPrice}/month
      </button>

      <div className="mt-8 border-t border-[var(--compass-map-border)] pt-6">
        <p className="comp-text-soft text-sm font-medium">
          Monthly membership
        </p>

        <p className="comp-text-soft mt-2 text-sm leading-relaxed">
          {monthlyPrice} per month. Cancel anytime. Your saved Compass Archive
          remains yours after the membership ends.
        </p>
      </div>
    </div>
  );
}
