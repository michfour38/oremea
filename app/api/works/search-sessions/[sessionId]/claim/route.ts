import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save this search to My WORKS." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const browserSessionId = clean(body?.browserSessionId);
  if (!browserSessionId) {
    return NextResponse.json({ error: "This search could not be linked to your account." }, { status: 400 });
  }

  const session = await prisma.works_search_sessions.findUnique({
    where: { id: params.sessionId },
    select: { id: true, browser_session_id: true, clerk_user_id: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Search session not found." }, { status: 404 });
  }

  if (session.browser_session_id !== browserSessionId) {
    return NextResponse.json({ error: "This browser does not own that anonymous search." }, { status: 403 });
  }

  if (session.clerk_user_id && session.clerk_user_id !== userId) {
    return NextResponse.json({ error: "This search is already attached to another WORKS account." }, { status: 409 });
  }

  const updated = await prisma.works_search_sessions.update({
    where: { id: session.id },
    data: { clerk_user_id: userId },
    select: { id: true, status: true, brief_id: true },
  });

  return NextResponse.json({
    sessionId: updated.id,
    status: updated.status,
    briefId: updated.brief_id,
    savedToMyWorks: true,
  });
}