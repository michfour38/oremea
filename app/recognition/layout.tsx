import Link from "next/link";

export default function RecognitionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Link
        href="https://www.oremea.com"
        target="_blank"
        rel="noreferrer"
        className="fixed left-4 top-4 z-[100] rounded-full border border-[#8E7140]/70 bg-[#0A0A0A]/90 px-4 py-2 text-sm text-[#E2D8C5] shadow-lg backdrop-blur transition hover:border-[#D6B97A] hover:text-[#D6B97A] md:left-6 md:top-6"
      >
        ← All products
      </Link>
      {children}
    </>
  );
}
