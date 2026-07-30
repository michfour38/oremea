import type { ReactNode } from "react";

import { CompassMapOrderEnhancer } from "@/components/compass/CompassMapOrderEnhancer";

import "./compass-legibility.css";

export default function CompassLayout({ children }: { children: ReactNode }) {
  return (
    <div className="compass-legibility">
      <CompassMapOrderEnhancer />
      {children}
    </div>
  );
}
