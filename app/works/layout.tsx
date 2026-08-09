import type { ReactNode } from "react";

import { WorksLegalFooter } from "@/components/works/works-legal-footer";

export default function WorksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <WorksLegalFooter />
    </>
  );
}
