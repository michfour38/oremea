"use client";

import { useEffect, useState } from "react";

const OREMEA_URL = "https://www.oremea.com";
const SHOW_TOP_AFTER_PX = 520;

function normalizeOremeaLinks() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    `a[href="${OREMEA_URL}"]`,
  );

  for (const link of links) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
}

export default function RecognitionShellControls() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateBackToTop = () => {
      setShowBackToTop(window.scrollY > SHOW_TOP_AFTER_PX);
    };

    normalizeOremeaLinks();
    updateBackToTop();

    const observer = new MutationObserver(normalizeOremeaLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", updateBackToTop, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateBackToTop);
    };
  }, []);

  if (!showBackToTop) return null;

  return (
    <button
      type="button"
      aria-label="Return to top"
      title="Return to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-36 right-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-[#C8A96A]/40 bg-black/80 font-serif text-xl text-[#C8A96A] shadow-lg backdrop-blur-xl transition hover:border-[#C8A96A] hover:bg-[#11100d] md:right-6"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
