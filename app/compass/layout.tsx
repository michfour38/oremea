import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CompassMapOrderEnhancer } from "@/components/compass/CompassMapOrderEnhancer";

import "./compass-legibility.css";

export const metadata: Metadata = {
  title: "Compass | Oremea",
};

export default function CompassLayout({ children }: { children: ReactNode }) {
  return (
    <div className="compass-legibility">
      <CompassMapOrderEnhancer />
      {children}
    </div>
  );
}
