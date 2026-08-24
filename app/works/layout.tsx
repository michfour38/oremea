import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WorksAcquisitionCapture } from "@/components/works/works-acquisition-capture";
import { WorksLegalFooter } from "@/components/works/works-legal-footer";
import {
  WORKS_BUYER_DESCRIPTION,
  WORKS_BUYER_TITLE,
  WORKS_ORIGIN,
  worksUrl,
} from "@/lib/works/seo";

export const metadata: Metadata = {
  metadataBase: new URL(WORKS_ORIGIN),
  title: WORKS_BUYER_TITLE,
  description: WORKS_BUYER_DESCRIPTION,
  applicationName: "WORKS",
  openGraph: {
    siteName: "WORKS by Oremea",
    title: WORKS_BUYER_TITLE,
    description: WORKS_BUYER_DESCRIPTION,
    type: "website",
    images: [
      {
        url: worksUrl("/works/works-logo.png"),
        width: 2000,
        height: 1000,
        alt: "WORKS by Oremea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: WORKS_BUYER_TITLE,
    description: WORKS_BUYER_DESCRIPTION,
    images: [worksUrl("/works/works-logo.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icons/works.svg", type: "image/svg+xml" }],
    shortcut: "/icons/works.svg",
  },
};

export default function WorksLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <WorksAcquisitionCapture />
      {children}
      <WorksLegalFooter currentYear={new Date().getFullYear()} />
    </div>
  );
}
