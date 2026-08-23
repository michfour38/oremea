import Link from "next/link";

const items = [
  { href: "/works/provider", label: "Profile & capacity" },
  { href: "/works/provider/capabilities", label: "Capabilities & matching" },
  { href: "/works/provider/inbox", label: "Inbox" },
  { href: "/works/provider/insights", label: "Demand insights" },
  { href: "/works/provider/reviews", label: "Reviews" },
  { href: "/works/provider/billing", label: "Plans & billing" },
] as const;

export function WorksProviderNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap justify-center gap-2" aria-label="WORKS provider workspace">
      {items.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-[#1f1c17] bg-[#1f1c17] text-white"
                : "border-black/10 bg-white/70 text-black/60 hover:border-black/25 hover:text-black"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
