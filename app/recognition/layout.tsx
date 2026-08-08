import Link from "next/link";
import "./recognition-theme.css";
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
      style={{ caretColor: "#D6B97A" }}
    >
      <RecognitionInputFocus />
      <Link
        href="https://www.oremea.com"
        target="_blank"
        rel="noreferrer"
        className="fixed left-4 top-4 z-[100] rounded-full border border-[#C6A96B]/70 bg-[#0A0A0A]/90 px-4 py-2 text-sm text-[#BFBFBF] shadow-lg backdrop-blur transition hover:border-[#D6B97A] hover:text-[#D6B97A] md:left-6 md:top-6"
      >
        ← All products
      </Link>
      {children}
    </div>
  );
}
