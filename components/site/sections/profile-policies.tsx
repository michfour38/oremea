import Link from "next/link";

const policies = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function ProfilePolicies() {
  return (
    <section className="bg-black/30">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
              Stewardship
            </p>
            <h2 className="mt-3 text-3xl font-light text-white">
              Your work remains yours
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Private reflections stay private until you intentionally choose to
              share them. Saved progress supports continuity across the Oremea
              ecosystem.
            </p>
          </div>
        </div>

        <nav
          className="mt-8 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Profile policies"
        >
          {policies.map((policy) => (
            <Link
              key={policy.href}
              href={policy.href}
              className="group flex items-center justify-between bg-zinc-950/90 px-6 py-5 text-sm text-zinc-300 transition hover:bg-amber-100/[0.06] hover:text-white"
            >
              {policy.label}
              <span className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-amber-100">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
