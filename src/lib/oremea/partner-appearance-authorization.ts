/**
 * Pure policy for an OREMEA appearance editor.
 * The server MUST supply userId from verified Clerk auth; the role flag comes
 * only from isOremeaAdmin, and grant data comes from the exact partner lookup.
 * This function cannot grant membership access or publishing rights.
 */
export type PartnerAppearanceRole = "admin" | "editor";
export type PartnerAppearanceAccess = { userId: string; role: PartnerAppearanceRole };

export function resolvePartnerAppearanceAccess(args: {
  requestedPartner: string;
  authenticatedUserId: string | null;
  isAdmin: boolean;
  exactPartnerGrant: {
    partner_slug: string;
    user_id: string;
    revoked_at: Date | null;
  } | null;
}): PartnerAppearanceAccess | null {
  const { requestedPartner, authenticatedUserId, isAdmin, exactPartnerGrant } = args;
  if (!/^[a-z0-9-]{1,64}$/.test(requestedPartner) || !authenticatedUserId) {
    return null;
  }
  if (isAdmin) return { userId: authenticatedUserId, role: "admin" };
  if (!exactPartnerGrant || exactPartnerGrant.partner_slug !== requestedPartner ||
    exactPartnerGrant.user_id !== authenticatedUserId ||
    exactPartnerGrant.revoked_at !== null) return null;
  return { userId: authenticatedUserId, role: "editor" };
}
