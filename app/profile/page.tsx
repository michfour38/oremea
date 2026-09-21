import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";

import { ProfileAccount } from "@/components/site/sections/profile-account";
import { ProfileCurrent } from "@/components/site/sections/profile-current";
import { ProfileHero } from "@/components/site/sections/profile-hero";
import { ProfileProducts } from "@/components/site/sections/profile-products";
import { ProfileSupport } from "@/components/site/sections/profile-support";
import { isOremeaAdmin } from "@/lib/auth/admin-access";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const isAdmin = await isOremeaAdmin(userId);

  return (
    <SiteShell>
      <ProfileHero />

      <ProfileAccount isAdmin={isAdmin} />

      <ProfileProducts />

      <ProfileCurrent />


      <ProfileSupport />
    </SiteShell>
  );
}
