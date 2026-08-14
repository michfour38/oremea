import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Harmonize | Oremea",
};

export default function HarmonizeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
