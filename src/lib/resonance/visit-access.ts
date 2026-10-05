import { isOremeaAdmin } from "@/lib/auth/admin-access";
import { hasCreatorSilverKey } from "@/lib/auth/creator-silver-key";
import {
  visitCheckoutEnabled,
  visitsEnabled,
} from "@/src/lib/resonance/visit-offers";

export async function visitCreditsAvailableFor(userId: string) {
  return (
    visitsEnabled() ||
    (await isOremeaAdmin(userId)) ||
    (await hasCreatorSilverKey(userId))
  );
}

export async function visitCheckoutAvailableFor(userId: string) {
  return visitCheckoutEnabled() || (await isOremeaAdmin(userId));
}
