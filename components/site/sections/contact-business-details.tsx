export function ContactBusinessDetails() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              Business Information
            </p>

            <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  Business
                </p>

                <p className="mt-2 text-zinc-200">Oremea</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  Location
                </p>

                <p className="mt-2 text-zinc-200">South Africa</p>
                <p className="text-zinc-500">Local is Lekker</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  Contact Email
                </p>

                <p className="mt-2 text-zinc-200">support@oremea.com</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#b79a63]/15 bg-[#b79a63]/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[#b79a63]">
              Platform Positioning
            </p>

            <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
              <p>
                Oremea is a structured self-awareness and relational
                intelligence ecosystem offering guided reflective systems,
                execution frameworks, communication-awareness tools, and
                intentional relational environments.
              </p>

              <p>
                The platform is designed around self-led participation,
                structured recognition, and intentional communication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
