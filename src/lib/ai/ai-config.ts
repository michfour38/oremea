export const AI_MODELS = {
  primary:
    process.env.AI_PRIMARY_MODEL ||
    "claude-sonnet-4-5-20250929",

  fallback:
    process.env.AI_FALLBACK_MODEL || null,
} as const