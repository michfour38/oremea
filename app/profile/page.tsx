import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";

import { ProfileAccount } from "@/components/site/sections/profile-account";
import { ProfileHero } from "@/components/site/sections/profile-hero";
import { ProfilePolicies } from "@/components/site/sections/profile-policies";
import { ProfileProducts } from "@/components/site/sections/profile-products";
import { ProfileProgress } from "@/components/site/sections/profile-progress";
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

      <ProfileProgress />

      <ProfileSupport />

      <ProfilePolicies />
    </SiteShell>
  );
}
