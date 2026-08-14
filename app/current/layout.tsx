import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The Current | Oremea",
};

export default function CurrentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
