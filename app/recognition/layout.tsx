import Link from "next/link";
import "./recognition-theme.css";

export default function RecognitionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="recognition-theme">
      <Link
        href="https://www.oremea.com"
        target="_blank"
        rel="noreferrer"
        className="fixed left-4 top-4 z-[100] rounded-full border border-[#C8A96A]/70 bg-[#0A0A0A]/90 px-4 py-2 text-sm text-zinc-300 shadow-lg backdrop-blur transition hover:border-[#C8A96A] hover:text-[#C8A96A] md:left-6 md:top-6"
      >
        ← All products
      </Link>
      {children}
    </div>
  );
}
