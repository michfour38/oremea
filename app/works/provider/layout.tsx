import type { ReactNode } from "react";

export default function WorksProviderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      {children}
    </div>
  );
}
