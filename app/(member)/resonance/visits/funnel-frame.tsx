export function FunnelFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="resonance-theme res-bg relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="res-photo-overlay relative min-h-screen">
        <header className="relative z-20 mx-auto flex max-w-4xl items-center px-6 pt-6">
          <div aria-label="Resonance by Oremea" className="inline-flex items-center gap-3">
            <img
              src="/images/oremea-logo-wht.png"
              alt="Oremea"
              className="h-9 w-auto opacity-90"
            />
            <span className="res-text-secondary text-xs uppercase tracking-[0.22em]">
              Resonance
            </span>
          </div>
        </header>
        <div className="relative z-20 mx-auto max-w-4xl px-6 py-12 md:py-16">{children}</div>
      </div>
    </main>
  );
}
