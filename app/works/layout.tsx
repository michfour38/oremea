import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WorksLegalFooter } from "@/components/works/works-legal-footer";

export const metadata: Metadata = {
  title: "WORKS | Oremea",
  description:
    "Describe what you want to make. WORKS builds a production route and finds manufacturers, suppliers and specialist providers that fit the brief.",
};

export default function WorksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <WorksLegalFooter />
    </>
  );
}
