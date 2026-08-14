"use client";

import { useEffect, useState } from "react";

const SHOW_TOP_AFTER_PX = 520;

export default function RecognitionShellControls() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateBackToTop = () => {
      setShowBackToTop(window.scrollY > SHOW_TOP_AFTER_PX);
    };

    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });

    return () => {
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
