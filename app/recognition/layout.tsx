import type { Metadata } from "next";

import { ReturnToTop } from "@/components/site/return-to-top";

import "./recognition-theme.css";
import "./recognition-reading.css";

export const metadata: Metadata = {
  title: "Recognition | Oremea",
  description:
    "A private AI discussion journal for thoughts that need more than a journal page. One focused question at a time, with meaning and choices remaining yours.",
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
