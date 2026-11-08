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
): Promise<Response> {
  const endpoint = "https://api.anthropic.com/v1/messages"
  const post = (options: RequestInit) => send(endpoint, {
    ...options, redirect: "error", signal: options.signal ?? AbortSignal.timeout(45000),
  })
  const primary = await post(init)
  if (primary.status !== 404) return primary

  const original: DirectTextRequest = JSON.parse(init.body)
  if (standby === original.model) return primary
  const error = await primary.clone().json().catch(() => null)
  if (error?.error?.type !== "not_found_error" ||
      !String(error.error.message).includes(original.model)) return primary

  const request = { ...original, model: standby,
    ...(standby === "claude-sonnet-5" ? { thinking: { type: "disabled" } } :
      standby === "claude-sonnet-5-5" ? { thinking: { type: "between_tools" } } : {}),
  }
  // Keep the application's sampling settings in the compatibility probe.
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
