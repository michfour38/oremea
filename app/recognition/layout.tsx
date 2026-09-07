import type { Metadata } from "next";

import { ReturnToTop } from "@/components/site/return-to-top";

import "./recognition-theme.css";
import "./recognition-reading.css";

const title = "Recognition — private AI discussion journal | Oremea";
const description =
  "Recognition stays close to your own words and one live thread, noticing distinctions, recurrence and unfinished thought without deciding what they mean for you.";

export const metadata: Metadata = {
  metadataBase: new URL("https://recognition.oremea.com"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://recognition.oremea.com/",
    siteName: "Oremea",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icons/recognition.svg", type: "image/svg+xml" }],
    shortcut: "/icons/recognition.svg",
  },
};

export default function RecognitionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      id="top"
      className="recognition-theme"
      data-recognition-root="true"
      style={{ caretColor: "#C8A96A" }}
    >
      <ReturnToTop />
      {children}
    </div>
  );
}
