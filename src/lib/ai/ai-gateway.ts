import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"

import { AI_MODELS } from "./ai-config"

export type GenerateAIParams = {
  task: string
  prompt: string
  maxTokens?: number
  system?: string
  cacheSystem?: boolean
  outputSchema?: Record<string, unknown>
}

export type AIUsage = {
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
}

export type GenerateAIResult = {
  text: string
  model: string
  usage: AIUsage
}

const PARTICIPANT_EVIDENCE_TASKS = new Set([
  "recognition_synthesis",
])

function readUsage(value: unknown): AIUsage {
  if (!value || typeof value !== "object") {
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    }
  }

  const usage = value as {
    input_tokens?: unknown
    output_tokens?: unknown
    cache_creation_input_tokens?: unknown
    cache_read_input_tokens?: unknown
  }
  const readNumber = (candidate: unknown) =>
    typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0

  return {
    inputTokens: readNumber(usage.input_tokens),
    outputTokens: readNumber(usage.output_tokens),
    cacheCreationInputTokens: readNumber(usage.cache_creation_input_tokens),
    cacheReadInputTokens: readNumber(usage.cache_read_input_tokens),
  }
}

export async function generateAI(params: GenerateAIParams): Promise<string | null> {
  const result = await generateAIWithUsage(params)
  return result?.text ?? null
}

export async function generateAIWithUsage({
  task,
  prompt,
  maxTokens = 1400,
  system,
  cacheSystem = false,
  outputSchema,
}: GenerateAIParams): Promise<GenerateAIResult | null> {
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
      system,
      cacheSystem,
      outputSchema,
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
  system,
  cacheSystem,
  outputSchema,
  allowTokenRetry = true,
}: {
  task: string
  model: string
  prompt: string
  maxTokens: number
  system?: string
  cacheSystem: boolean
  outputSchema?: Record<string, unknown>
  allowTokenRetry?: boolean
}): Promise<GenerateAIResult | null> {
  try {
    const systemBlocks = system
      ? [
          {
            type: "text",
            text: system,
            ...(cacheSystem
              ? { cache_control: { type: "ephemeral" } }
              : {}),
          },
        ]
      : undefined

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
          ...(systemBlocks ? { system: systemBlocks } : {}),
          ...(outputSchema
            ? {
                output_config: {
                  format: {
                    type: "json_schema",
                    schema: outputSchema,
                  },
                },
              }
            : {}),
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
          system,
          cacheSystem,
          outputSchema,
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

    return {
      text,
      model,
      usage: readUsage(data?.usage),
    }
  } catch (error) {
    console.error(
      `AI request failed for task "${task}" using "${model}":`,
      error,
    )

    return null
  }
}