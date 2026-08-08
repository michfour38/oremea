import Link from "next/link";
import "./recognition-theme.css";
import "./recognition-reading.css";
import RecognitionInputFocus from "./recognition-input-focus";

export default function RecognitionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="recognition-theme"
      data-recognition-root="true"
      style={{ caretColor: "#C8A96A" }}
    >
      <RecognitionInputFocus />
      <Link
        href="https://www.oremea.com"
        target="_blank"
        rel="noreferrer"
        className="fixed left-4 top-4 z-[100] rounded-full border border-[#C8A96A]/35 bg-black/80 px-4 py-2 text-sm text-zinc-200 shadow-lg backdrop-blur-xl transition hover:border-[#C8A96A] hover:text-[#C8A96A] md:left-6 md:top-6"
      >
        ← All products
      </Link>
      {children}
    </div>
  );
}
