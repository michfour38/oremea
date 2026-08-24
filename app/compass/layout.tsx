import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CompassMapOrderEnhancer } from "@/components/compass/CompassMapOrderEnhancer";

import "./compass-legibility.css";

export const metadata: Metadata = {
  title: "Compass | Oremea",
  description:
    "Turn what matters into clear direction, keep it visible on a working Map, and make the next movement that is actually yours.",
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
