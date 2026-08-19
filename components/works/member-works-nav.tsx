"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { WorksBrand } from "@/components/works/works-brand";

export function MemberWorksNav({
  href = "/works",
  action,
}: {
  href?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
      <WorksBrand href={href} context="by Oremea · South Africa" />
      {action ?? (
        <SignedIn>
          <UserButton afterSignOutUrl="/works" />
        </SignedIn>
      )}
    </header>
  );
}
