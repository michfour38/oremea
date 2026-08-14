import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Resonance | Oremea",
  icons: {
    icon: [{ url: "/icons/resonance.svg", type: "image/svg+xml" }],
    shortcut: "/icons/resonance.svg",
  },
};

export default function ResonanceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
