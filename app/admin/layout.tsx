import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "Oremea Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPage();
  return children;
}
