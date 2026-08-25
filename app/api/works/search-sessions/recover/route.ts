import { WorksSearchSessionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  normalizeWorksBrowserSessionId,
  setWorksBrowserSessionCookie,
} from "@/lib/works/searches/anonymous-search-ownership";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const marketSlug = stringValue(body?.marketSlug).toLowerCase();
    const browserSessionId = normalizeWorksBrowserSessionId(body?.browserSessionId);

    if (!marketSlug || !browserSessionId) {
      return NextResponse.json({ candidate: null }, { status: 400 });
    }

    const market = await prisma.works_markets.findUnique({
      where: { slug: marketSlug },
      select: { id: true, active: true },
    });

    if (!market?.active) {
      return NextResponse.json({ candidate: null }, { status: 404 });
    }

    const session = await prisma.works_search_sessions.findFirst({
      where: {
        market_id: market.id,
        browser_session_id: browserSessionId,
        status: { not: WorksSearchSessionStatus.ABANDONED },
      },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        status: true,
        updated_at: true,
        brief: { select: { product_description: true } },
      },
    });

    const response = NextResponse.json({
      candidate: session
        ? {
            sessionId: session.id,
            productDescription: session.brief?.product_description ?? null,
            status: session.status,
            updatedAt: session.updated_at.toISOString(),
          }
        : null,
    });

    if (session) {
      setWorksBrowserSessionCookie({
        response,
        marketSlug,
        browserSessionId,
      });
    }

    return response;
  } catch (error) {
    console.error("WORKS browser-session recovery failed:", error);
    return NextResponse.json(
      { error: "WORKS could not reconnect to saved progress yet." },
      { status: 503 }
    );
  }
}
