import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Resonance | Oremea",
};

export default function OremeaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0">
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
          style={{
            backgroundImage: "url('/images/desktop/bg-entry.webp')",
          }}
        />

        <div
          className="absolute inset-0 block bg-cover bg-center bg-no-repeat md:hidden"
          style={{
            backgroundImage: "url('/images/mobile/bg-entry.webp')",
          }}
        />
      </div>

      <div className="fixed inset-0 bg-black/15" />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.12),transparent_45%),linear-gradient(to_bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.5))]" />

      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
