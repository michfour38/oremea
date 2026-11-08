export const AI_MODELS = {
  primary:
    process.env.AI_PRIMARY_MODEL ||
    "claude-sonnet-5-5",

  fallback:
    process.env.AI_FALLBACK_MODEL || null,
} as const