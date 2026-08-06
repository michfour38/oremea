import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function emailValue(value: unknown) {
  const email = stringValue(value).toLowerCase();
  return email.includes("@") ? email : "";
}

export async function GET(req: NextRequest) {
  try {
    const searchSessionId = stringValue(req.nextUrl.searchParams.get("searchSessionId"));
    const briefId = stringValue(req.nextUrl.searchParams.get("briefId"));

    if (!searchSessionId || !briefId) {
      return NextResponse.json({ contact: null });
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

    const session = await prisma.works_search_sessions.findUnique({
      where: { id: searchSessionId },
      select: { id: true, brief_id: true },
    });

    if (!session || session.brief_id !== briefId) {
      return NextResponse.json(
        { error: "This search and production brief do not match." },
        { status: 400 }
      );
    }

    const request = await prisma.$transaction(async (tx) => {
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
          status: "REQUESTED",
        },
        select: { id: true, status: true },
      });

      await tx.works_search_sessions.update({
        where: { id: searchSessionId },
        data: { status: "SOURCING_REQUESTED" },
      });

      await tx.works_product_briefs.update({
        where: { id: briefId },
        data: { contact_email: email, status: "SOURCING_REQUESTED" },
      });

      return procurementRequest;
    });

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
