import Link from "next/link";

const products = [
  {
    name: "Resonance",
    label: "Live now",
    href: "/oremea/enter?source=oremea_home",
    description:
      "A guided 10-week self-reflection journey for people who want to understand their relational patterns with more honesty, structure, and depth.",
    active: true,
  },
  {
    name: "Harmonize",
    label: "Coming later",
    description:
      "A relational clarity layer for couples or two people who want to understand the pattern between them without turning conflict into blame.",
    active: false,
  },
  {
    name: "The Compass",
    label: "Coming later",
    description:
      "A decision and execution layer that turns awareness into one clear next step.",
    active: false,
  },
  {
    name: "The Current",
    label: "Coming later",
    description:
      "A future meeting space for people who have moved through the work and want to meet others with greater depth and intention.",
    active: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090806] text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <img
  src="/oremea-logo.png"
  alt="Oremea"
  className="h-8 w-auto opacity-90"
/>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-7xl">
            Return to what is already within you.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Oremea is a house of reflective products for pattern awareness,
            relational clarity, and self-led recognition.
          </p>

        </div>

        <div className="mt-16 flex flex-col gap-4">
          {products.map((product) => {
            const card = (
              <div
                className={`rounded-[2rem] border p-6 transition ${
                  product.active
                    ? "border-[#c8a96a]/35 bg-[#15120c] hover:bg-[#1b160d]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl text-white">
                    {product.name === "Resonance" ? (
                      <>
                        Reso
                        <span className="italic text-[#c8a96a]">nance</span>
                      </>
                    ) : (
                      product.name
                    )}
                  </h2>

                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {product.description}
                </p>

                {product.active ? (
                  <p className="mt-5 text-sm text-[#c8a96a]">
                    Enter Reso
                    <span className="italic text-[#c8a96a]">nance</span> →
                  </p>
                ) : null}
              </div>
            );

            if (product.active && product.href) {
              return (
                <Link key={product.name} href={product.href}>
                  {card}
                </Link>
              );
            }

            return <div key={product.name}>{card}</div>;
          })}
        </div>

        <p className="mt-10 text-xs leading-6 text-zinc-600">
          Entry source is passed through from this page as{" "}
          <span className="text-zinc-500">oremea_home</span>.
        </p>
      </section>
    </main>
  );
}