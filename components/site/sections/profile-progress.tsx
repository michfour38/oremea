import Link from "next/link";

const pathways = [
  {
    number: "01",
    title: "Recognition",
    line: "Help me see myself.",
    description:
      "A clear reflection of what is present, what is repeating, and what is asking to be named.",
    href: "/recognition",
  },
  {
    number: "02",
    title: "Resonance",
    line: "Help me stay with myself.",
    description:
      "A structured course of daily reflection, follow-through, and a closing Mirror.",
    href: "/entry",
  },
  {
    number: "03",
    title: "Compass",
    line: "Help me move.",
    description:
      "A guided descent from what holds attention into the direction ready for participation.",
    href: "/compass",
  },
];

export function ProfileProgress() {
  return (
    <section className="border-b border-white/5 bg-black/25">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            The Oremea work
          </p>
          <h2 className="mt-3 text-3xl font-light text-white md:text-4xl">
            Return through the door you need
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            Each product holds a distinct movement. Your profile keeps their
            records together while each experience remains complete in itself.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {pathways.map((pathway) => (
            <Link
              key={pathway.title}
              href={pathway.href}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/65 p-7 transition hover:-translate-y-0.5 hover:border-amber-100/25"
            >
              <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-100/[0.04] blur-2xl transition group-hover:bg-amber-100/[0.08]" />
              <div className="relative">
                <p className="text-xs tracking-[0.18em] text-zinc-600">
                  {pathway.number}
                </p>
                <h3 className="mt-8 text-2xl font-light text-zinc-100">
                  {pathway.title}
                </h3>
                <p className="mt-2 text-sm text-amber-100/80">{pathway.line}</p>
                <p className="mt-5 text-sm leading-7 text-zinc-400">
                  {pathway.description}
                </p>
                <p className="mt-7 text-sm text-zinc-200 transition group-hover:text-amber-100">
                  Open {pathway.title} →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
