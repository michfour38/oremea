import { isOremeaAdmin } from "@/lib/auth/admin-access";
import {
  visitCheckoutEnabled,
  visitsEnabled,
} from "@/src/lib/resonance/visit-offers";

export async function visitCreditsAvailableFor(userId: string) {
  return visitsEnabled() || (await isOremeaAdmin(userId));
}

export async function visitCheckoutAvailableFor(userId: string) {
  return visitCheckoutEnabled() || (await isOremeaAdmin(userId));
}
