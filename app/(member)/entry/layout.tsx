import type { ReactNode } from "react";
import { PartnerProductThemeScope } from "@/components/oremea/PartnerProductThemeScope";

/** The room chooser shares Resonance's visual context, never its purchase gates. */
export default function EntryLayout({ children }: { children: ReactNode }) {
  return <PartnerProductThemeScope product="resonance">{children}</PartnerProductThemeScope>;
}
