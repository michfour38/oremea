import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import {
  RESONANCE_ROOM_MARKETING,
  getOremeaMarketingProduct,
} from "@/src/lib/oremea/public-product-marketing";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";

const canonicalUrl = "https://www.oremea.com/resonance-rooms";
const title = "Choose a Resonance room | Oremea";
const description =
  "Ten private seven-day reflection rooms for ten different relational questions. Each room is complete, standalone and chosen separately.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oremea.com"),
  title,
  description,
  alternates: { canonical: "/resonance-rooms" },
  openGraph: {
    type: "website",
    url: canonicalUrl,
    siteName: "Oremea",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

const rooms = RESONANCE_ROOM_MARKETING.map((marketing) => {
  const product = getOremeaMarketingProduct(marketing.id);
  return {
    ...product,
    marketing,
  };
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Oremea Resonance rooms",
  description,
  numberOfItems: rooms.length,
  itemListElement: rooms.map((room, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: room.name,
      description: room.marketing.description,
      url: room.commerce.url,
      offers: {
        "@type": "Offer",
        url: room.commerce.url,
        priceCurrency: room.commercial.currency,
        price: (room.commercial.priceCents / 100).toFixed(2),
        availability: "https://schema.org/InStock",
      },
    },
  })),
};

export default function ResonanceRoomsPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <header className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]">
            Resonance
          </p>
          <h1 className="mt-5 font-serif text-4xl font-light tracking-tight text-white md:text-6xl">
            Ten rooms. Ten different questions. No required order.
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-300">
            Choose one private seven-day room at a time. Every room is complete
            and standalone: it stays inside one relational territory, and you
            decide whether another room is ever useful.
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Each room is a one-time purchase with seven days of access. It does
            not renew automatically. Your completed visit remains available in
            your Archive.
          </p>
        </header>

        <section
          aria-label="Resonance rooms"
          className="mt-12 grid gap-5 lg:grid-cols-2"
        >
          {rooms.map((room) => {
            const price = formatOremeaPrice(
              room.commercial.priceCents,
              room.commercial.currency,
            );

            return (
              <article
                key={room.id}
                className="flex flex-col rounded-[2rem] border border-[#c8a96a]/25 bg-[#15120c] p-6 md:p-8"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#c8a96a]">
                    Room {room.marketing.weekNumber}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl text-white">
                    {room.name.replace("Resonance · ", "")}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-[#f1dfb4]">
                    {room.marketing.headline}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    {room.marketing.description}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    <span className="text-zinc-200">Choose this room when: </span>
                    {room.marketing.chooseWhen.replace(
                      /^Choose [^.]+ when /,
                      "",
                    )}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-sm text-zinc-400">What it will not do</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                    {room.marketing.limits.map((limit) => (
                      <li key={limit}>— {limit}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                  <div>
                    <p className="text-2xl text-[#f1dfb4]">{price}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      once · seven days · no renewal
                    </p>
                  </div>
                  <a
                    href={room.commerce.url}
                    className="rounded-full border border-[#c8a96a]/55 px-5 py-3 text-sm text-[#f1dfb4] transition hover:border-[#c8a96a] hover:bg-[#c8a96a]/10"
                  >
                    Choose {room.name.replace("Resonance · ", "")}
                  </a>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="font-serif text-2xl text-white">
            A room is a choice, not a sequence
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            There is no first room, final room or completion ladder. If your
            question is about seeing your own thought more clearly, Recognition
            may fit better. If something is ready to move, Compass may fit
            better.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link
              href="https://recognition.oremea.com"
              className="text-[#c8a96a] hover:text-[#f1dfb4]"
            >
              See Recognition →
            </Link>
            <Link
              href="https://compass.oremea.com"
              className="text-[#c8a96a] hover:text-[#f1dfb4]"
            >
              See Compass →
            </Link>
            <Link
              href="/compare"
              className="text-zinc-400 hover:text-[#f1dfb4]"
            >
              Compare the three forms
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
