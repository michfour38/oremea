import type { ReactNode } from "react";

import "./funnel-alignment.css";

export default function RecognitionPurchaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="recognition-purchase-funnel">{children}</div>;
}
