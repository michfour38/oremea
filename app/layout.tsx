import { ClerkProvider } from "@clerk/nextjs";

import { ValidationNavigator } from "@/components/ui/validation-navigator";

import "./globals.css";

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
