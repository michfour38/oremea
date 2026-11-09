// Called only after Anthropic explicitly rejects a configured model ID.
// No participant prompt, response, user identifier or provider error body leaves the app.
const DISPATCH_URL =
  "https://api.github.com/repos/michfour38/oremea/actions/workflows/anthropic-model-watch.yml/dispatches"

const SUCCESS_COOLDOWN_MS = 6 * 60 * 60 * 1000
const FAILURE_COOLDOWN_MS = 10 * 60 * 1000

type ProviderError = {
  error?: {
    type?: unknown
    message?: unknown
  }
}

export function isAnthropicModelNotFound(
  status: number,
  body: unknown,
  model: string,
): boolean {
  if (status !== 404 || !/^claude-[a-z0-9-]+$/i.test(model)) return false
  if (!body || typeof body !== "object") return false

  const error = (body as ProviderError).error
  if (error?.type !== "not_found_error" || typeof error.message !== "string") {
    return false
  }

  // A generic 404, unknown API route or inaccessible account is not sufficient.
  // Match the complete model ID, not a prefix of another model's ID.
  const mentionedModels: string[] = error.message.match(/claude-[a-z0-9-]+/gi) ?? []
  return /\bmodel\b/i.test(error.message) && mentionedModels.includes(model)
}

export function createArgusRecoveryDispatcher({
  send = fetch,
  now = Date.now,
}: {
  send?: typeof fetch
  now?: () => number
} = {}) {
  // Reserve the cooldown before awaiting the request, so concurrent failures
  // within the same server instance trigger at most one GitHub dispatch.
  let nextEligibleAt = 0

  return async function dispatch(
    env: Record<string, string | undefined> = process.env,
  ): Promise<boolean> {
    const token = env.ARGUS_GITHUB_DISPATCH_TOKEN?.trim()
    if (!token) return false

    const time = now()
    if (time < nextEligibleAt) return false
    nextEligibleAt = time + FAILURE_COOLDOWN_MS

    try {
      const response = await send(DISPATCH_URL, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(2500),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        // GitHub's existing protected workflow performs its own verification
        // and can only publish an allowlisted model-only PR after tests.
        body: JSON.stringify({ ref: "main" }),
      })

      if (!response.ok) {
        console.error(`ARGUS recovery dispatch rejected (HTTP ${response.status}).`)
        return false
      }

      nextEligibleAt = time + SUCCESS_COOLDOWN_MS
      console.info("ARGUS recovery check queued after a confirmed model-not-found response.")
      return true
    } catch {
      console.error("ARGUS recovery dispatch unavailable; existing model fallback remains enabled.")
      return false
    }
  }
}

export const dispatchArgusRecovery = createArgusRecoveryDispatcher()
