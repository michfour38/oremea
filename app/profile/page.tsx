import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";

import { ProfileAccount } from "@/components/site/sections/profile-account";
import { ProfileCurrent } from "@/components/site/sections/profile-current";
import { ProfileHero } from "@/components/site/sections/profile-hero";
import { ProfileProducts } from "@/components/site/sections/profile-products";
import { ProfileSupport } from "@/components/site/sections/profile-support";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <SiteShell>
      <ProfileHero />

      <ProfileAccount />

      <ProfileProducts />

      <ProfileCurrent />

      <ProfileSupport />
    </SiteShell>
  );
}
