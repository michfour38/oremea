import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRouteSummary } from "@/lib/works/routes/get-route-summary";
import { ownsWorksAnonymousSearch } from "@/lib/works/searches/anonymous-search-ownership";

export async function GET(req: NextRequest, props: { params: Promise<{ briefId: string }> }) {
  const params = await props.params;
  try {
    const searchSessionId = req.nextUrl.searchParams.get("searchSessionId")?.trim();
    if (!searchSessionId) {
      return NextResponse.json(
        { error: "Search session is required." },
        { status: 400 }
      );
    }

    const session = await prisma.works_search_sessions.findUnique({
      where: { id: searchSessionId },
      select: {
        brief_id: true,
        browser_session_id: true,
        market: { select: { slug: true } },
      },
    });

    if (
      !session ||
      session.brief_id !== params.briefId ||
      !ownsWorksAnonymousSearch({
        request: req,
        marketSlug: session.market.slug,
        expectedBrowserSessionId: session.browser_session_id,
      })
    ) {
      return NextResponse.json(
        { error: "This production brief does not belong to this browser search." },
        { status: 404 }
      );
    }

    const route = await getRouteSummary(params.briefId);
    return NextResponse.json({ route, routeError: null });
  } catch (error) {
    console.error("WORKS route restore failed:", error);
    return NextResponse.json(
      { error: "WORKS could not restore this route." },
      { status: 500 }
    );
  }
}
