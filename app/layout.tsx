import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import { ValidationNavigator } from "@/components/ui/validation-navigator";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oremea.com"),
  title: "Oremea | Pattern awareness for clearer participation",
  description:
    "Structured reflective products for self-recognition, relational clarity, aligned execution, and intentional connection.",
  applicationName: "Oremea",
  openGraph: {
    type: "website",
    siteName: "Oremea",
    title: "Oremea | Pattern awareness for clearer participation",
    description:
      "Structured reflective products for self-recognition, relational clarity, aligned execution, and intentional connection.",
  },
  twitter: {
    card: "summary",
    title: "Oremea | Pattern awareness for clearer participation",
    description:
      "Structured reflective products for self-recognition, relational clarity, aligned execution, and intentional connection.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ValidationNavigator />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
