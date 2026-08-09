import Link from "next/link";

const items = [
  {
    title: "Recognition",
    href: "/recognition",
  },
  {
    title: "Resonance",
    href: "/resonance",
  },
  {
    title: "Compass",
    href: "/compass",
  },
];

export function ProfileProgress() {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-5xl px-5 py-10 md:py-12">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">
          Explore Oremea
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-3xl border border-white/10 bg-black/25 px-6 py-5 backdrop-blur-sm transition hover:border-amber-200/20 hover:bg-black/35"
            >
              <h3 className="text-xl tracking-[0.12em] text-zinc-100">
                {item.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
