import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function answerObject(value: unknown): Prisma.InputJsonObject | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Prisma.InputJsonObject;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await prisma.works_search_sessions.findUnique({
      where: { id: params.sessionId },
      select: {
        id: true,
        answers: true,
        current_step: true,
        status: true,
        brief_id: true,
      },
    });

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await req.json();
    const answers = answerObject(body?.answers);
    const currentStep = body?.currentStep === null
      ? null
      : stringValue(body?.currentStep) || undefined;

    const session = await prisma.works_search_sessions.update({
      where: { id: params.sessionId },
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
