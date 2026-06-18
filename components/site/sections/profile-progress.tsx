import Link from "next/link";

const items = [
  {
    title: "Resonance",
    href: "/journey",
  },
  {
    title: "Compass",
    href: "/compass",
  },
  {
    title: "Harmonize",
    href: "/harmonize",
  },
  {
    title: "The Current",
    href: "/current",
  },
];

export function ProfileProgress() {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">
          Explore Oremea
        </p>

        <div className="mt-10 flex flex-col gap-6">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-[2rem] border border-white/10 bg-black/25 px-7 py-8 backdrop-blur-sm transition hover:border-amber-200/20 hover:bg-black/35"
            >
              <h3 className="text-2xl tracking-[0.14em] text-zinc-100">
                {item.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}