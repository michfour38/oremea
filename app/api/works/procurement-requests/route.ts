import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { ownsWorksAnonymousSearch } from "@/lib/works/searches/anonymous-search-ownership";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function emailValue(value: unknown) {
  const email = stringValue(value).toLowerCase();
  return email.includes("@") ? email : "";
}

const WORKS_CAPTURE_POINTS = new Set([
  "provider-outreach",
  "route-sourcing-fallback",
]);

function capturePointValue(value: unknown) {
  const point = stringValue(value).slice(0, 80);
  return WORKS_CAPTURE_POINTS.has(point) ? point : undefined;
}

function sourceSummary(session: {
  landing_path: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
}) {
  const parts = [
    session.utm_source ? `source=${session.utm_source}` : "",
    session.utm_medium ? `medium=${session.utm_medium}` : "",
    session.utm_campaign ? `campaign=${session.utm_campaign}` : "",
    session.utm_term ? `term=${session.utm_term}` : "",
    session.utm_content ? `content=${session.utm_content}` : "",
    session.referrer_host ? `referrer=${session.referrer_host}` : "",
    session.landing_path ? `landing=${session.landing_path}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Direct / unattributed";
}

async function notifyOremeaOfSourcingLead({
  session,
  briefId,
  requestId,
  name,
  email,
  phone,
  preferredContactMethod,
  capturePoint,
}: {
  session: NonNullable<Awaited<ReturnType<typeof ownedSession>>>;
  briefId: string;
  requestId: string;
  name: string;
  email: string;
  phone?: string;
  preferredContactMethod?: string;
  capturePoint?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.WORKS_OUTREACH_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();
  const to = process.env.WORKS_LEAD_NOTIFY_TO?.trim() || "support@oremea.com";
  if (!apiKey || !from || !to) {
    console.warn("WORKS sourcing lead notification is not configured.");
    return;
  }

  const brief = await prisma.works_product_briefs.findUnique({
    where: { id: briefId },
    select: {
      product_description: true,
      stage: true,
      target_quantity: true,
      quantity_unit: true,
      administrative_area: true,
    },
  });
  const product = brief?.product_description?.replace(/\s+/g, " ").trim() || "New sourcing request";
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `WORKS sourcing lead: ${product.slice(0, 90)}`,
    text: [
      "A new WORKS buyer has asked to continue sourcing.",
      "",
      `Product / need: ${product}`,
      brief?.stage ? `Stage: ${brief.stage}` : "",
      brief?.target_quantity != null
        ? `Quantity: ${String(brief.target_quantity)} ${brief.quantity_unit ?? ""}`.trim()
        : "",
      brief?.administrative_area ? `Area: ${brief.administrative_area}` : "",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : "",
      preferredContactMethod ? `Preferred contact: ${preferredContactMethod}` : "",
      `Conversion point: ${capturePoint ?? "unknown"}`,
      `Acquisition: ${sourceSummary(session)}`,
      `Request ID: ${requestId}`,
      `Brief ID: ${briefId}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

async function ownedSession(
  req: NextRequest,
  searchSessionId: string,
  briefId: string
) {
  const session = await prisma.works_search_sessions.findUnique({
    where: { id: searchSessionId },
    select: {
      id: true,
      brief_id: true,
      browser_session_id: true,
      landing_path: true,
      referrer_host: true,
      utm_source: true,
      utm_medium: true,
      utm_campaign: true,
      utm_term: true,
      utm_content: true,
      market: { select: { slug: true } },
    },
  });

  if (
    !session ||
    session.brief_id !== briefId ||
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

export async function GET(req: NextRequest) {
  try {
    const searchSessionId = stringValue(req.nextUrl.searchParams.get("searchSessionId"));
    const briefId = stringValue(req.nextUrl.searchParams.get("briefId"));

    if (!searchSessionId || !briefId) {
      return NextResponse.json({ contact: null });
    }

    if (!(await ownedSession(req, searchSessionId, briefId))) {
      return NextResponse.json({ contact: null }, { status: 404 });
    }

    const request = await prisma.works_procurement_requests.findFirst({
      where: {
        search_session_id: searchSessionId,
        brief_id: briefId,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        preferred_contact_method: true,
      },
    });

    return NextResponse.json({
      contact: request
        ? {
            name: request.name,
            email: request.email,
            phone: request.phone ?? "",
            preferredContactMethod: request.preferred_contact_method ?? "EMAIL",
          }
        : null,
    });
  } catch (error) {
    console.error("WORKS procurement contact restore failed:", error);
    return NextResponse.json({ contact: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const searchSessionId = stringValue(body?.searchSessionId);
    const briefId = stringValue(body?.briefId);
    const name = stringValue(body?.name);
    const email = emailValue(body?.email);
    const phone = stringValue(body?.phone) || undefined;
    const preferredContactMethod = stringValue(body?.preferredContactMethod) || undefined;
    const capturePoint = capturePointValue(body?.capturePoint);

    if (!searchSessionId || !briefId) {
      return NextResponse.json(
        { error: "This WORKS brief is missing its search record." },
        { status: 400 }
      );
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: "Add your name and email so WORKS can get back to you." },
        { status: 400 }
      );
    }

    const session = await ownedSession(req, searchSessionId, briefId);

    if (!session) {
      return NextResponse.json(
        { error: "This search and production brief are not available to this browser." },
        { status: 404 }
      );
    }

    const request = await prisma.$transaction(async (tx) => {
      const existingRequest = await tx.works_procurement_requests.findUnique({
        where: { search_session_id: searchSessionId },
        select: { id: true },
      });
      const procurementRequest = await tx.works_procurement_requests.upsert({
        where: { search_session_id: searchSessionId },
        update: {
          name,
          email,
          phone,
          preferred_contact_method: preferredContactMethod,
          status: "REQUESTED",
          consented_at: new Date(),
        },
        create: {
          search_session_id: searchSessionId,
          brief_id: briefId,
          name,
          email,
          phone,
          preferred_contact_method: preferredContactMethod,
          capture_point: capturePoint,
          status: "REQUESTED",
        },
        select: { id: true, status: true },
      });

      await tx.works_search_sessions.update({
        where: { id: session.id },
        data: { status: "SOURCING_REQUESTED" },
      });

      await tx.works_product_briefs.update({
        where: { id: briefId },
        data: { contact_email: email, status: "SOURCING_REQUESTED" },
      });

      return { ...procurementRequest, newlyCreated: !existingRequest };
    });

    if (request.newlyCreated) {
      try {
        await notifyOremeaOfSourcingLead({
          session,
          briefId,
          requestId: request.id,
          name,
          email,
          phone,
          preferredContactMethod,
          capturePoint,
        });
      } catch (notificationError) {
        console.error("WORKS sourcing lead notification failed:", notificationError);
      }
    }

    return NextResponse.json({
      requestId: request.id,
      status: request.status,
      message: "WORKS will continue looking for suitable providers for this brief.",
    });
  } catch (error) {
    console.error("WORKS procurement request failed:", error);
    return NextResponse.json(
      { error: "WORKS could not save this sourcing request yet." },
      { status: 500 }
    );
  }
}
