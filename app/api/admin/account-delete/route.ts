import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  deleteOremeaAccountState,
  getAccountDeletionPreflight,
} from "@/lib/auth/account-deletion";
import { getAccountDeletionExtraBlockers } from "@/lib/auth/account-deletion-extra-guards";
import { isOremeaAdmin } from "@/lib/auth/admin-access";
import { requireAdminAction } from "@/lib/auth/require-admin";
import { hasOremeaOwnerAccess } from "@/src/lib/oremea/owner-recovery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeleteBody = {
  email?: unknown;
  userId?: unknown;
  confirmation?: unknown;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const requestOrigin = request.headers.get("origin");
    const expectedOrigin = new URL(request.url).origin;
    if (requestOrigin !== expectedOrigin) {
      return json({ error: "Invalid request origin." }, 403);
    }

    const { userId: actorId } = await requireAdminAction();
    const body = (await request.json()) as DeleteBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const reviewedUserId = typeof body.userId === "string" ? body.userId.trim() : "";
    const confirmation =
      typeof body.confirmation === "string" ? body.confirmation.trim() : "";

    if (!email || !email.includes("@") || !reviewedUserId) {
      return json({ error: "A reviewed account is required." }, 400);
    }

    if (confirmation !== `DELETE ${email}`) {
      return json({ error: `Type DELETE ${email} exactly to continue.` }, 400);
    }

    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      emailAddress: [email],
      limit: 2,
    });

    if (data.length !== 1 || data[0].id !== reviewedUserId) {
      return json(
        { error: "The Clerk identity changed after review. Review the account again." },
        409,
      );
    }

    const target = data[0];
    if (target.id === actorId) {
      return json({ error: "The active admin account cannot delete itself." }, 403);
    }
    if ((await isOremeaAdmin(target.id)) || (await hasOremeaOwnerAccess(target.id))) {
      return json({ error: "Owner/admin identities cannot be deleted here." }, 403);
    }

    const verifiedEmails = target.emailAddresses
      .filter((item) => item.verification?.status === "verified")
      .map((item) => item.emailAddress.trim().toLowerCase());
    if (verifiedEmails.length !== 1 || verifiedEmails[0] !== email) {
      return json(
        {
          error:
            "The Clerk identity no longer has exactly one matching verified email. Review the account again.",
        },
        409,
      );
    }

    const [preflight, extraBlockers] = await Promise.all([
      getAccountDeletionPreflight({ userId: target.id, email }),
      getAccountDeletionExtraBlockers({ userId: target.id, email }),
    ]);
    const blockers = [
      ...preflight.blockers.map((item) => item.message),
      ...extraBlockers,
    ];

    if (!preflight.canDelete || extraBlockers.length > 0) {
      return json(
        {
          error: "Deletion is blocked by retained or shared records.",
          blockers,
        },
        409,
      );
    }

    await deleteOremeaAccountState({ userId: target.id, email });

    try {
      await client.users.deleteUser(target.id);
    } catch {
      return json(
        {
          partial: true,
          error:
            "Oremea state was deleted, but Clerk identity deletion failed. Review the same email again to finish the Clerk deletion.",
        },
        502,
      );
    }

    return json({ deleted: true, email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account deletion failed.";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return json({ error: message }, status);
  }
}
