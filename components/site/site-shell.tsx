import { ReactNode } from "react";

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

      <a
        href="#top"
        className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#b79a63]/45 bg-black/60 text-xl text-[#b79a63] shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-[#b79a63] hover:bg-black/75 md:bottom-5"
        aria-label="Return to top"
      >
        ↟
      </a>
    </div>
  );
}
