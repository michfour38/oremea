import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";

import { ProfileAccount } from "@/components/site/sections/profile-account";
import { ProfileHero } from "@/components/site/sections/profile-hero";
import { ProfileProducts } from "@/components/site/sections/profile-products";
import { ProfileSupport } from "@/components/site/sections/profile-support";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <SiteShell>
      <ProfileHero />

      <ProfileAccount />

      <ProfileProducts />

      <ProfileSupport />
    </SiteShell>
  );
}
