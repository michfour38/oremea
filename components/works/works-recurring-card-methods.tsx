import Image from "next/image";

export function WorksRecurringCardMethods({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "rounded-2xl border border-black/10 bg-white/70 p-4" : "rounded-3xl border border-black/10 bg-white p-5 md:p-6"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/40">
            Recurring card setup · PayFast by Network
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-black/50">
            Paid WORKS subscriptions are created with a card on PayFast&apos;s secure checkout. The initial recurring authorisation includes 3D Secure. WORKS does not receive or store full card details.
          </p>
        </div>
        <div className="flex items-center gap-4" aria-label="Accepted recurring card brands">
          <Image src="/payments/works/visa.svg" alt="Visa" width={63} height={21} unoptimized />
          <Image src="/payments/works/mastercard.svg" alt="Mastercard" width={34} height={21} unoptimized />
        </div>
      </div>
    </div>
  );
}
