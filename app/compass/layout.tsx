import type { ReactNode } from "react";

import "./compass-legibility.css";

export default function CompassLayout({ children }: { children: ReactNode }) {
  return <div className="compass-legibility">{children}</div>;
}
