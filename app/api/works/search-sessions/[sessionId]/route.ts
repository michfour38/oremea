import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ownsWorksAnonymousSearch } from "@/lib/works/searches/anonymous-search-ownership";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function answerObject(value: unknown): Prisma.InputJsonObject | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Prisma.InputJsonObject;
}

async function ownedSession(req: NextRequest, sessionId: string) {
  const session = await prisma.works_search_sessions.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      answers: true,
      current_step: true,
      status: true,
      brief_id: true,
      browser_session_id: true,
      market: { select: { slug: true } },
    },
  });

  if (
    !session ||
    !ownsWorksAnonymousSearch({
      request: req,
      marketSlug: session.market.slug,
      expectedBrowserSessionId: session.browser_session_id,
    })
  ) {
    return null;
  }

  return session;
}

export async function GET(req: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  try {
    const session = await ownedSession(req, params.sessionId);

    if (!session) {
      return NextResponse.json({ error: "Search session not found." }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      answers: session.answers,
      currentStep: session.current_step,
      status: session.status,
      briefId: session.brief_id,
    });
  } catch (error) {
    console.error("WORKS search session read failed:", error);
    return NextResponse.json(
      { error: "WORKS could not restore this search." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  try {
    const existing = await ownedSession(req, params.sessionId);
    if (!existing) {
      return NextResponse.json({ error: "Search session not found." }, { status: 404 });
    }

    const body = await req.json();
    const answers = answerObject(body?.answers);
    const currentStep = body?.currentStep === null
      ? null
      : stringValue(body?.currentStep) || undefined;

    const session = await prisma.works_search_sessions.update({
      where: { id: existing.id },
      data: {
        ...(answers !== undefined ? { answers } : {}),
        ...(currentStep !== undefined ? { current_step: currentStep } : {}),
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ sessionId: session.id, status: session.status });
  } catch (error) {
    console.error("WORKS search session update failed:", error);
    return NextResponse.json(
      { error: "WORKS could not save this search yet." },
      { status: 500 }
    );
  }
}
