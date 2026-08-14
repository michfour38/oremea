import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CompassMapOrderEnhancer } from "@/components/compass/CompassMapOrderEnhancer";

import "./compass-legibility.css";

export const metadata: Metadata = {
  title: "Compass | Oremea",
  icons: {
    icon: [{ url: "/icons/compass.svg", type: "image/svg+xml" }],
    shortcut: "/icons/compass.svg",
  },
};

export default function CompassLayout({ children }: { children: ReactNode }) {
  return (
    <div className="compass-legibility">
      <CompassMapOrderEnhancer />
      {children}
    </div>
  );
}
