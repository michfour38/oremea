import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import {
  RESONANCE_ROOM_MARKETING,
  getOremeaMarketingProduct,
} from "@/src/lib/oremea/public-product-marketing";

const canonicalUrl = "https://www.oremea.com/resonance-rooms";
const title = "Explore Resonance rooms | Oremea";
const description =
  "Ten private seven-stage reflection rooms. Buy Resonance visits first, then choose each room only when you are ready to enter it.";

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
      url: `${canonicalUrl}#room-${room.marketing.weekNumber}`,
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
          <p className="text-xs uppercase tracking-[0.3em] text-[#e7c98b]">
            Resonance
          </p>
          <h1 className="mt-5 font-serif text-4xl font-light tracking-tight text-white md:text-6xl">
            Buy the visits first. Choose the room when you are ready.
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-100">
            Resonance has ten private seven-stage rooms, each holding a different
            relational territory. Purchasing visits does not lock those choices
            in advance. An unused visit stays available until you decide which
            room to open.
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-200">
            One room can be active at a time. A later visit can open a different
            room or return to one you have used before, while completed visits
            remain preserved in your Archive.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href="/resonance/enter"
              className="rounded-full border border-[#e7c98b]/65 px-5 py-3 text-sm text-[#e7c98b] transition hover:border-[#e7c98b] hover:bg-[#e7c98b]/10"
            >
              Explore Resonance visits
            </Link>
          </div>
        </header>

        <section
          aria-label="Resonance rooms"
          className="mt-12 grid gap-5 lg:grid-cols-2"
        >
          {rooms.map((room) => (
            <article
              id={`room-${room.marketing.weekNumber}`}
              key={room.id}
              className="flex flex-col rounded-[2rem] border border-[#e7c98b]/30 bg-[#15120c] p-6 md:p-8"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e7c98b]">
                  Room {room.marketing.weekNumber}
                </p>
                <h2 className="mt-3 font-serif text-3xl text-white">
                  {room.name.replace("Resonance · ", "")}
                </h2>
                <p className="mt-4 text-base leading-7 text-[#e7c98b]">
                  {room.marketing.headline}
                </p>
                <p className="mt-4 text-sm leading-7 text-zinc-100">
                  {room.marketing.description}
                </p>
                <p className="mt-4 text-sm leading-7 text-zinc-200">
                  <span className="text-zinc-100">Choose this room when: </span>
                  {room.marketing.chooseWhen.replace(
                    /^Choose [^.]+ when /,
                    "",
                  )}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                <div>
                  <p className="text-sm text-[#e7c98b]">Open this room</p>
                  <p className="mt-1 text-xs text-zinc-200">
                    Seven guided reflection stages · move at your own pace · no renewal
                  </p>
                </div>
                <Link
                  href="/resonance/enter"
                  className="rounded-full border border-[#e7c98b]/65 px-5 py-3 text-sm text-[#e7c98b] transition hover:border-[#e7c98b] hover:bg-[#e7c98b]/10"
                >
                  Get Resonance visits
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-14 rounded-[2rem] border border-white/15 bg-white/[0.03] p-6 md:p-8">
          <h2 className="font-serif text-2xl text-white">
            A room is a choice, not a sequence
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-100">
            There is no first room, final room or completion ladder. Buying
            several visits does not require choosing several rooms now. If your
            question is about seeing your own thought more clearly, Recognition
            may fit better. If something is ready to move, Compass may fit
            better.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link
              href="https://recognition.oremea.com"
              className="text-[#e7c98b] hover:text-white"
            >
              See Recognition →
            </Link>
            <Link
              href="https://compass.oremea.com"
              className="text-[#e7c98b] hover:text-white"
            >
              See Compass →
            </Link>
            <Link
              href="/compare"
              className="text-zinc-200 hover:text-white"
            >
              Compare the three forms
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
