type ProductLaunchPriceProps = {
  launchPrice: string;
  regularPrice: string;
  unit: string;
  className?: string;
};

export function ProductLaunchPrice({
  launchPrice,
  regularPrice,
  unit,
  className = "",
}: ProductLaunchPriceProps) {
  return (
    <div
      className={`${className} flex flex-wrap items-baseline gap-2 text-sm`.trim()}
    >
      <span className="text-xs uppercase tracking-[0.14em] text-[#b79a63]/75">
        Launch offer
      </span>
      <span className="text-zinc-500 line-through">{regularPrice}</span>
      <span className="text-lg text-[#b79a63]">{launchPrice}</span>
      <span className="text-zinc-500">{unit}</span>
    </div>
  );
}
