import { auth } from "@clerk/nextjs/server";
import { isOremeaAdmin } from "@/lib/auth/admin-access";

export async function FunnelFrame({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const adminMode = Boolean(userId && (await isOremeaAdmin(userId)));

  return (
    <main className="resonance-theme res-bg relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="res-photo-overlay relative min-h-screen">
        <header className="relative z-20 mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 pt-6">
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
          {adminMode ? (
            <span className="res-accent-border res-panel rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
              Admin test mode
            </span>
          ) : null}
        </header>
        <div className="relative z-20 mx-auto max-w-4xl px-6 py-12 md:py-16">{children}</div>
      </div>
    </main>
  );
}
