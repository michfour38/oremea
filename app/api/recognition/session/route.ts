import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  RecognitionType,
  getRecognitionQuestions,
} from "../../../../src/lib/recognition/recognition.service";

const REFINEMENT_WINDOW_MS = 4 * 60 * 60 * 1000;

type CleanAnswer = {
  questionKey: string;
  questionText: string;
  response: string;
  responseOrder: number;
};

function serializeSession(session: {
  id: string;
  lead_id: string;
  entry_type: string;
  status: string;
  created_at: Date;
}) {
  return {
    id: session.id,
    leadId: session.lead_id,
    entryType: session.entry_type,
    status: session.status,
    createdAt: session.created_at.toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : "";

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    const entryType: RecognitionType = "neutral";
    const source =
      typeof body?.source === "string" ? body.source.trim() : "direct";

    const answers = Array.isArray(body?.answers) ? body.answers : [];

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const questions = getRecognitionQuestions(entryType);

    const cleanedAnswers: CleanAnswer[] = answers
      .map((item: unknown) => {
        if (!item || typeof item !== "object") return null;

        const value = item as {
          questionKey?: unknown;
          response?: unknown;
        };

        const questionKey =
          typeof value.questionKey === "string" ? value.questionKey.trim() : "";

        const response =
          typeof value.response === "string" ? value.response.trim() : "";

        if (!questionKey || !response) return null;

        const question = questions.find((candidate) => candidate.key === questionKey);
        if (!question) return null;

        return {
          questionKey,
          questionText: question.text,
          response,
          responseOrder:
            questions.findIndex((candidate) => candidate.key === questionKey) + 1,
        };
      })
      .filter((item: CleanAnswer | null): item is CleanAnswer => Boolean(item));

    if (cleanedAnswers.length < 3) {
      return NextResponse.json(
        { error: "At least 3 completed answers are required" },
        { status: 400 },
      );
    }

    const existingLead = await prisma.entry_leads.findUnique({
      where: { email },
      select: {
        id: true,
        entry_mirror_sessions: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            id: true,
            completed_at: true,
            mirror_generated_at: true,
            entry_mirror_outputs: {
              select: { id: true },
            },
          },
        },
      },
    });

    const latestSession = existingLead?.entry_mirror_sessions[0] ?? null;
    const lastCompletedAt =
      latestSession?.completed_at ?? latestSession?.mirror_generated_at ?? null;
    const canUseIncludedRefinement = Boolean(
      latestSession &&
        latestSession.entry_mirror_outputs.length === 1 &&
        lastCompletedAt &&
        Date.now() - lastCompletedAt.getTime() <= REFINEMENT_WINDOW_MS,
    );

    const lead = await prisma.entry_leads.upsert({
      where: { email },
      update: {
        first_name: firstName || undefined,
        source,
        intro_started_at: new Date(),
        last_seen_panel_key: "recognition",
        last_seen_panel_at: new Date(),
      },
      create: {
        email,
        first_name: firstName || null,
        source,
        intro_started_at: new Date(),
        last_seen_panel_key: "recognition",
        last_seen_panel_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
      },
    });

    if (canUseIncludedRefinement && latestSession) {
      const session = await prisma.$transaction(async (tx) => {
        await tx.entry_mirror_responses.deleteMany({
          where: { session_id: latestSession.id },
        });

        await tx.entry_mirror_responses.createMany({
          data: cleanedAnswers.map((answer) => ({
            session_id: latestSession.id,
            question_key: answer.questionKey,
            question_text: answer.questionText,
            response: answer.response,
            response_order: answer.responseOrder,
          })),
        });

        return tx.entry_mirror_sessions.update({
          where: { id: latestSession.id },
          data: {
            status: "responses_captured",
            completed_at: null,
            mirror_generated_at: null,
          },
          select: {
            id: true,
            lead_id: true,
            entry_type: true,
            status: true,
            created_at: true,
          },
        });
      });

      return NextResponse.json({
        lead,
        session: serializeSession(session),
        refinement: true,
      });
    }

    const session = await prisma.entry_mirror_sessions.create({
      data: {
        lead_id: lead.id,
        entry_type: entryType,
        status: "responses_captured",
        entry_mirror_responses: {
          create: cleanedAnswers.map((answer) => ({
            question_key: answer.questionKey,
            question_text: answer.questionText,
            response: answer.response,
            response_order: answer.responseOrder,
          })),
        },
      },
      select: {
        id: true,
        lead_id: true,
        entry_type: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      lead,
      session: serializeSession(session),
      refinement: false,
    });
  } catch (error) {
    console.error("Recognition session route failed:", error);

    return NextResponse.json(
      { error: "Recognition session route failed" },
      { status: 500 },
    );
  }
}
