import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Resonance | Oremea",
  icons: {
    icon: [{ url: "/icons/resonance.svg", type: "image/svg+xml" }],
    shortcut: "/icons/resonance.svg",
  },
};

export default function OremeaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="resonance-theme res-bg relative min-h-screen overflow-hidden">
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

      <div className="res-marketing-dim fixed inset-0" />
      <div className="res-marketing-overlay fixed inset-0" />

      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
