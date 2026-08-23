import { NextRequest, NextResponse } from "next/server";

const MAIN_ROUTES = [
  "/",
  "/explore",
  "/compare",
  "/contact",
  "/terms",
  "/privacy",
  "/disclaimer",
  "/refunds",
  "/conduct",
] as const;

function getHostname(request: NextRequest) {
  const rawHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";

  return rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlsFor(hostname: string) {
  if (hostname === "oremea.com" || hostname === "www.oremea.com") {
    return MAIN_ROUTES.map((path) => `https://www.oremea.com${path === "/" ? "" : path}`);
  }

  if (hostname === "recognition.oremea.com") {
    return ["https://recognition.oremea.com/"];
  }

  if (hostname === "compass.oremea.com") {
    return ["https://compass.oremea.com/"];
  }

  return [];
}

export function GET(request: NextRequest) {
  const urls = urlsFor(getHostname(request));

  if (urls.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
