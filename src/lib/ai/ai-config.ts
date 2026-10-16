export const AI_MODELS = {
  primary:
    process.env.AI_PRIMARY_MODEL ||
    "claude-test-rejection",

  fallback:
    process.env.AI_FALLBACK_MODEL || null,
} as const