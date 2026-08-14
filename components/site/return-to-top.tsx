export function ReturnToTop() {
  return (
    <a
      href="#top"
      className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#b79a63]/45 bg-black/60 text-xl text-[#b79a63] shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-[#b79a63] hover:bg-black/75 md:bottom-5"
      aria-label="Return to top"
    >
      ↟
    </a>
  );
}
