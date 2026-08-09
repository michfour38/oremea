export function ContactHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(183,154,99,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-5xl px-5 py-14">
        <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
          Contact
        </p>

        <h1 className="max-w-3xl text-4xl font-light leading-tight text-zinc-100 md:text-5xl">
          Support and business contact for Oremea.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          For account access, payment questions, product support, or general
          enquiries, contact Oremea directly.
        </p>
      </div>
    </section>
  );
}
