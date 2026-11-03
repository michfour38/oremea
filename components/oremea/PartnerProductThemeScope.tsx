import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";

import { getActivePartnerBrand } from "@/src/lib/oremea/partner-brand-context";
import type { PartnerGateProduct } from "@/src/lib/oremea/partner-membership-contract";
import { partnerThemeStyle } from "@/src/lib/oremea/partner-theme";

/**
 * A purely visual wrapper: never changes product access or content.
 * Direct buyers and unverified partner memberships retain original OREMEA.
 */
export async function PartnerProductThemeScope({
  product,
  children,
}: {
  product: PartnerGateProduct;
  children: ReactNode;
}) {
  const { userId } = await auth();
  const partner = userId ? await getActivePartnerBrand(userId, product) : null;
  if (!partner) return <>{children}</>;

  return (
    <div
      className="partner-theme-scope"
      data-partner-theme={partner.slug}
      style={partnerThemeStyle(partner.brand)}
    >
      {children}
    </div>
  );
}
