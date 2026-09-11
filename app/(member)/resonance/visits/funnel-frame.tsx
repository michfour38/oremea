import MemberNav from "../../member-nav";

export function FunnelFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-white">
      <div className="fixed inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }} />
      <div className="relative min-h-screen bg-black/65">
        <MemberNav />
        <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">{children}</div>
      </div>
    </main>
  );
}
