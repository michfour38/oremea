import { NextRequest, NextResponse } from "next/server";

import {
  AppearanceConflictError,
  getPartnerAppearanceEditor,
  readPartnerAppearanceDraft,
  savePartnerAppearanceDraft,
} from "@/src/lib/oremea/partner-appearance-server";
import { isKnownPartner } from "@/src/lib/oremea/partner-appearance-contract";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ slug: string }> };

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  if (!isKnownPartner(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const editor = await getPartnerAppearanceEditor(slug);
  if (!editor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const stored = await readPartnerAppearanceDraft(slug);
  return NextResponse.json({ ...stored, role: editor.role }, { headers: noStore });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  if (!isKnownPartner(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const editor = await getPartnerAppearanceEditor(slug);
  if (!editor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Mutation endpoints are same-origin only; a valid login alone is not CSRF protection.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }


  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 12_000) {
    return NextResponse.json({ error: "Appearance request too large" }, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid appearance payload" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  try {
    const stored = await savePartnerAppearanceDraft({
      slug,
      userId: editor.userId,
      expectedRevision: body.revision as number,
      appearance: body.appearance,
    });
    return NextResponse.json({ ...stored, saved: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof AppearanceConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409, headers: noStore });
    }
    if (error instanceof Error &&
      /Invalid|Unknown|Upload and verify|image path|asset/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: noStore });
    }
    console.error("Partner appearance draft save failed.");
    return NextResponse.json({ error: "Could not save partner appearance" }, { status: 500, headers: noStore });
  }
}
