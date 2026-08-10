import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"

import { AI_MODELS } from "./ai-config"

export type GenerateAIParams = {
  task: string
  prompt: string
  maxTokens?: number
}

const PARTICIPANT_EVIDENCE_TASKS = new Set([
  "recognition_synthesis",
])

export async function generateAI({
  task,
  prompt,
  maxTokens = 1400,
}: GenerateAIParams): Promise<string | null> {
  const effectivePrompt = PARTICIPANT_EVIDENCE_TASKS.has(task)
    ? `${OREMEA_EVIDENCE_BOUNDARY}\n\n${prompt}`
    : prompt

  const models = [
    AI_MODELS.primary,
    AI_MODELS.fallback,
  ].filter(
    (model): model is string => Boolean(model),
  )

  for (const model of models) {
    const result = await callAnthropicModel({
      task,
      model,
      prompt: effectivePrompt,
      maxTokens,
    })

    if (result) {
      return result
    }
  }

  console.error(
    `AI generation failed for task "${task}" across all configured models.`,
  )

  return null
}

async function callAnthropicModel({
  task,
  model,
  prompt,
  maxTokens,
  allowTokenRetry = true,
}: {
  task: string
  model: string
  prompt: string
  maxTokens: number
  allowTokenRetry?: boolean
}): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":
            process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      },
    )

    const data = await res.json()

    if (data?.stop_reason === "max_tokens") {
      if (allowTokenRetry) {
        console.warn(
          `AI model "${model}" reached the token limit for task "${task}". Retrying with more room.`,
        )

        return callAnthropicModel({
          task,
          model,
          prompt,
          maxTokens: Math.min(maxTokens * 2, 4000),
          allowTokenRetry: false,
        })
      }

      console.error(
        `AI model "${model}" remained truncated for task "${task}" after retry.`,
      )

      return null
    }

    if (!res.ok) {
      console.error(
        `AI model attempt failed for task "${task}" using "${model}":`,
        data,
      )

      return null
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(
            (item: {
              type?: string
              text?: string
            }) => item?.type === "text",
          )
          .map(
            (item: { text?: string }) =>
              item.text ?? "",
          )
          .join("\n\n")
          .trim()
      : ""

    if (!text) {
      console.error(
        `AI model "${model}" returned no text for task "${task}".`,
      )

      return null
    }

    return text
  } catch (error) {
    console.error(
      `AI request failed for task "${task}" using "${model}":`,
      error,
    )

    return null
  }
}
