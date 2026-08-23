import { NextRequest, NextResponse } from "next/server";

const PRIVATE_PATHS = [
  "/api/",
  "/auth/",
  "/sign-in",
  "/sign-up",
  "/dashboard",
  "/profile",
  "/settings",
  "/archive",
  "/begin",
  "/map",
  "/journey",
  "/entry",
  "/oremea/",
  "/recognition/archive",
  "/compass/archive",
  "/compass/map",
  "/resonance/enter",
  "/resonance/resume",
  "/current",
  "/harmonize",
  "/works",
] as const;

const PUBLIC_DISCOVERY_AGENTS = [
  "Googlebot",
  "bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-CloudVertexBot",
] as const;

const TRAINING_CONTROL_AGENTS = ["GPTBot", "ClaudeBot", "Google-Extended"] as const;

const PRIVATE_HOSTS = new Set([
  "app.oremea.com",
  "works.oremea.com",
  "resonance.oremea.com",
  "current.oremea.com",
  "harmonize.oremea.com",
]);

function getHostname(request: NextRequest) {
  const rawHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";

  return rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
}

function publicRules(userAgent: string) {
  return [
    `User-agent: ${userAgent}`,
    "Allow: /",
    ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
  ].join("\n");
}

function sitemapFor(hostname: string) {
  if (hostname === "recognition.oremea.com") {
    return "https://recognition.oremea.com/sitemap.xml";
  }

  if (hostname === "compass.oremea.com") {
    return "https://compass.oremea.com/sitemap.xml";
  }

  if (hostname === "oremea.com" || hostname === "www.oremea.com") {
    return "https://www.oremea.com/sitemap.xml";
  }

  return null;
}

export function GET(request: NextRequest) {
  const hostname = getHostname(request);

  if (PRIVATE_HOSTS.has(hostname)) {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  const groups = [
    ...PUBLIC_DISCOVERY_AGENTS.map(publicRules),
    publicRules("*"),
    ...TRAINING_CONTROL_AGENTS.map(
      (userAgent) => `User-agent: ${userAgent}\nDisallow: /`,
    ),
  ];

  const sitemap = sitemapFor(hostname);
  const body = `${groups.join("\n\n")}${
    sitemap ? `\n\nSitemap: ${sitemap}` : ""
  }\n`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
