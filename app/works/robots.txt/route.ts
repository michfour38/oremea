import { WORKS_PRIVATE_PATHS, worksUrl } from "@/lib/works/seo";

const SEARCH_AND_RETRIEVAL_AGENTS = [
  "Googlebot",
  "bingbot",
  "OAI-SearchBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "ChatGPT-User",
  "Claude-User",
  "Perplexity-User",
] as const;

function publicRules(userAgents: readonly string[]) {
  return [
    ...userAgents.map((agent) => `User-agent: ${agent}`),
    "Allow: /",
    ...WORKS_PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
    "",
  ];
}
export function GET() {
  const body = [
    // Search discovery is enabled. Training access remains fail-closed
    // until Oremea makes a separate, explicit policy decision.
    "User-agent: GPTBot",
    "User-agent: ClaudeBot",
    "Disallow: /",
    "",
    ...publicRules(SEARCH_AND_RETRIEVAL_AGENTS),
    ...publicRules(["*"]),
    `Sitemap: ${worksUrl("/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
