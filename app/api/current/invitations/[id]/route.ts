import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  declineCurrentInvitation,
  startCurrentCheckout,
} from "@/src/lib/current/current-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "decline") {
      const invitation = await declineCurrentInvitation({
        userId,
        invitationId: params.id,
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "This invitation is no longer pending." },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, status: "declined" });
    }

    if (action === "accept") {
      const checkout = await startCurrentCheckout({
        userId,
        invitationId: params.id,
      });

      if (!checkout) {
        return NextResponse.json(
          { error: "This invitation is no longer pending." },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl });
    }

    return NextResponse.json(
      { error: "Choose accept or decline." },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/current/invitations/[id] failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Current invitation could not be updated.",
      },
      { status: 500 },
    );
  }
}
