import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Resonance | Oremea",
};

export default function ResonanceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
