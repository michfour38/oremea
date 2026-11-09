import { reportArgusModelFailure } from "./argus-runtime-recovery"

// Direct text integrations keep their original request until the provider rejects its model.
type DirectTextRequest = {
  model: string
  max_tokens: number
  temperature?: number
  messages: { role: string; content: string }[]
}

export async function sendDirectText(
  init: RequestInit & { body: string },
  standby: string,
  send: typeof fetch = fetch,
  reportFailure = reportArgusModelFailure,
): Promise<Response> {
  const endpoint = "https://api.anthropic.com/v1/messages"
  const post = (options: RequestInit) => send(endpoint, {
    ...options, redirect: "error", signal: options.signal ?? AbortSignal.timeout(45000),
  })
  const primary = await post(init)
  if (primary.status !== 404) return primary

  let original: DirectTextRequest
  try { original = JSON.parse(init.body) as DirectTextRequest }
  catch { return primary }
  const error: unknown = await primary.clone().json().catch(() => null)
  // Signal only a model-specific Anthropic 404. The shared reporter never
  // sends participant text or provider error bodies to GitHub/logs.
  if (!await reportFailure(primary.status, error, original.model)) return primary
  if (standby === original.model) return primary

  const request = { ...original, model: standby,
    ...(standby === "claude-sonnet-5" ? { thinking: { type: "disabled" } } :
      standby === "claude-sonnet-5-5" ? { thinking: { type: "between_tools" } } : {}),
  }
  // Sonnet 5 rejects non-default sampling. Leave all active 4.6 requests intact.
  if (standby === "claude-sonnet-5") delete request.temperature
  // Verify exactly the request settings that the replacement will receive.
  const probe = await post({ ...init, body: JSON.stringify({ ...request,
    messages: [{ role: "user", content: "Synthetic availability check. Reply exactly: ARGUS_OK" }],
  }) })
  if (!probe.ok) return primary
  const reply = await probe.json().catch(() => null)
  if (reply?.model !== standby || reply.stop_reason !== "end_turn" ||
      !Array.isArray(reply.content) ||
      reply.content.filter((item: { type: string }) => item.type === "text")
        .map((item: { text: string }) => item.text).join("").trim() !== "ARGUS_OK") return primary
  return post({ ...init, body: JSON.stringify(request) })
}
