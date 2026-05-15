import { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Desktop Background */}
      <div
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{
          backgroundImage: "url('/images/desktop/bg-home.webp')",
        }}
      />

      {/* Mobile Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{
          backgroundImage: "url('/images/mobile/bg-home.webp')",
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10">
        <SiteNav />

        <main>{children}</main>

        <SiteFooter />
      </div>
    </div>
  );
}