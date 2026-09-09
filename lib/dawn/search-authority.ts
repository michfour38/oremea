/**
 * DAWN Search Authority
 *
 * Evidence/measurement policy only. This file must never be used to mutate
 * product truth, pricing, launch state, affiliate activation, paid marketing,
 * or model-training permissions without separate explicit authority.
 */

export const DAWN_SEARCH_AUTHORITY_VERSION = "2026-09-09" as const;

export const PROTECTED_DECISIONS = [
  "product_truth",
  "pricing",
  "launch_state",
  "affiliate_activation",
  "paid_marketing",
  "model_training_permissions",
] as const;

export const CRAWLER_AUTHORITY = {
  google: {
    discoveryAgents: ["Googlebot"],
    trainingControlAgents: ["Google-Extended"],
    verification: "official_googlebot_verification",
  },
  bing: {
    discoveryAgents: ["bingbot"],
    verification: "official_bing_crawler_verification",
  },
  openai: {
    discoveryAgents: ["OAI-SearchBot", "ChatGPT-User"],
    trainingControlAgents: ["GPTBot"],
    verification: "official_openai_published_ranges_when_waf_verification_is_required",
  },
  anthropic: {
    discoveryAgents: ["Claude-SearchBot", "Claude-User"],
    trainingControlAgents: ["ClaudeBot"],
    verification: "official_anthropic_guidance",
  },
  perplexity: {
    discoveryAgents: ["PerplexityBot", "Perplexity-User"],
    verification: "official_perplexity_user_agent_and_published_ip_ranges",
  },
} as const;

export const DISCOVERY_MEASUREMENT_REGISTRY = {
  googleSearchConsole: {
    mode: "observation_only",
    dimensions: ["impressions", "pages", "country", "device", "date"],
    generativeAiReporting: "ingest_when_available_for_property",
  },
  bingWebmasterAiPerformance: {
    mode: "observation_only",
    dimensions: [
      "total_citations",
      "average_cited_pages",
      "grounding_queries",
      "page_level_citation_activity",
      "visibility_trends_over_time",
    ],
    rule: "record_only_metrics_officially_available_in_bing_webmaster_tools",
    interpretation: "citation_activity_is_retrieval_evidence_not_ranking_authority_or_causation",
  },
  aiCitationEvidence: {
    mode: "observation_only",
    dimensions: ["provider", "cited_url", "observed_at", "query_or_intent_when_available"],
    rule: "citation_is_evidence_of_retrieval_not_ranking_authority_or_causation",
  },
} as const;

export const WAF_POLICY = {
  principle: "verify_before_special_treatment",
  rules: [
    "Do not trust a crawler user-agent alone when the provider publishes a verification method.",
    "Do not bypass the WAF globally for crawlers.",
    "Keep public discovery and model-training permissions independent.",
    "Private/member product surfaces remain blocked from crawler discovery unless explicitly re-authorized.",
  ],
} as const;

export const MATERIAL_CHANGE_SCOPE = [
  "crawling",
  "indexing",
  "ai_search_citation_or_retrieval",
  "search_console_or_bing_measurement",
  "waf_crawler_handling",
  "evidence_based_marketing",
] as const;

export function requiresExplicitAuthority(decision: string) {
  return (PROTECTED_DECISIONS as readonly string[]).includes(decision);
}
