import { ReactNode } from "react";

import { ReturnToTop } from "./return-to-top";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div id="top" className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="fixed inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{
          backgroundImage: "url('/images/desktop/bg-home.webp')",
        }}
      />

      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{
          backgroundImage: "url('/images/mobile/bg-home.webp')",
        }}
      />

      <div className="fixed inset-0 bg-black/55" />

      <div className="relative z-10">
        <SiteNav />

        <main>{children}</main>

        <SiteFooter />
      </div>

      <ReturnToTop />
    </div>
  );
}
