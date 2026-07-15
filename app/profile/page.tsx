import { SiteShell } from "@/components/site/site-shell";

import { ProfileAccount } from "@/components/site/sections/profile-account";
import { ProfileHero } from "@/components/site/sections/profile-hero";
import { ProfilePolicies } from "@/components/site/sections/profile-policies";
import { ProfileProducts } from "@/components/site/sections/profile-products";
import { ProfileProgress } from "@/components/site/sections/profile-progress";
import { ProfileSupport } from "@/components/site/sections/profile-support";
import { ProfileRelationshipSpaces } from "@/components/site/sections/profile-relationship-spaces";

export default function ProfilePage() {
  return (
    <SiteShell>
      <ProfileHero />

      <ProfileAccount />

      <ProfileProducts />

      <ProfileRelationshipSpaces />

      <ProfileProgress />

      <ProfileSupport />

      <ProfilePolicies />
    </SiteShell>
  );
}