import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  normalizeWorksBrowserSessionId,
  setWorksBrowserSessionCookie,
} from "@/lib/works/searches/anonymous-search-ownership";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function limitedString(value: unknown, maxLength: number) {
  return stringValue(value).slice(0, maxLength);
}

function answerObject(value: unknown): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Prisma.InputJsonObject;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const marketSlug = stringValue(body?.marketSlug).toLowerCase();
    const browserSessionId = normalizeWorksBrowserSessionId(body?.browserSessionId);
    const currentStep = stringValue(body?.currentStep) || undefined;
    const answers = answerObject(body?.answers);
    const attribution =
      body?.attribution && typeof body.attribution === "object" && !Array.isArray(body.attribution)
        ? body.attribution
        : {};
    const landingPath = limitedString(attribution?.landingPath, 1024);
    const referrerHost = limitedString(attribution?.referrerHost, 255).toLowerCase();
    const utmSource = limitedString(attribution?.utmSource, 255);
    const utmMedium = limitedString(attribution?.utmMedium, 255);
    const utmCampaign = limitedString(attribution?.utmCampaign, 255);
    const utmTerm = limitedString(attribution?.utmTerm, 255);
    const utmContent = limitedString(attribution?.utmContent, 255);

    if (!marketSlug) {
      return NextResponse.json({ error: "Market is required." }, { status: 400 });
    }

    if (!browserSessionId) {
      return NextResponse.json(
        { error: "This browser could not establish a safe WORKS search session." },
        { status: 400 }
      );
    }

    const market = await prisma.works_markets.findUnique({
      where: { slug: marketSlug },
      select: { id: true, active: true },
    });

    if (!market?.active) {
      return NextResponse.json({ error: "WORKS is not active in this market." }, { status: 404 });
    }

    const session = await prisma.works_search_sessions.create({
      data: {
        market_id: market.id,
        browser_session_id: browserSessionId,
        landing_path: landingPath || undefined,
        referrer_host: referrerHost || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        utm_term: utmTerm || undefined,
        utm_content: utmContent || undefined,
        answers,
        current_step: currentStep,
      },
      select: { id: true, status: true },
    });

    const response = NextResponse.json({
      sessionId: session.id,
      status: session.status,
    });
    setWorksBrowserSessionCookie({
      response,
      marketSlug,
      browserSessionId,
    });
    return response;
  } catch (error) {
    console.error("WORKS search session creation failed:", error);
    return NextResponse.json(
      { error: "WORKS could not save this search yet." },
      { status: 500 }
    );
  }
}
