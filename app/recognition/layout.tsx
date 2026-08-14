import type { Metadata } from "next";
import "./recognition-theme.css";
import "./recognition-reading.css";
import RecognitionInputFocus from "./recognition-input-focus";
import RecognitionShellControls from "./recognition-shell-controls";

export const metadata: Metadata = {
  title: "Recognition | Oremea",
  description:
    "An ongoing private recursive accountability conversation that helps you see yourself clearly and stay accountable to your own words without directing your next move.",
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
      className="recognition-theme"
      data-recognition-root="true"
      style={{ caretColor: "#C8A96A" }}
    >
      <RecognitionInputFocus />
      <RecognitionShellControls />
      {children}
    </div>
  );
}
