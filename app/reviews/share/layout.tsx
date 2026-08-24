import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share your experience | Oremea",
  description:
    "Privately submit an Oremea reflection for human review before any public publication.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShareReviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
