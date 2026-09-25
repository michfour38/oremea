import MemberNav from "../../member-nav";

export function FunnelFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="resonance-theme res-bg relative min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }} />
      <div className="res-photo-overlay relative min-h-screen">
        <MemberNav />
        <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">{children}</div>
      </div>
    </main>
  );
}
