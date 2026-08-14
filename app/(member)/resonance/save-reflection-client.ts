export type ResonanceReflectionSaveResult = {
  ok: boolean;
  error?: string;
  code?: string;
  build?: string;
};

export async function saveResonanceReflection(params: {
  promptId: string;
  response: string;
}): Promise<ResonanceReflectionSaveResult> {
  const request = await fetch("/api/resonance/reflections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const result = (await request.json().catch(() => null)) as
    | ResonanceReflectionSaveResult
    | null;

  if (!request.ok || !result?.ok) {
    return {
      ok: false,
      error:
        result?.error ??
        `This reflection could not be saved (HTTP ${request.status}). Please try again.`,
      code: result?.code ?? `HTTP_${request.status}`,
      build: result?.build,
    };
  }

  return { ok: true, build: result.build };
}

export function formatResonanceSaveError(
  result: ResonanceReflectionSaveResult,
) {
  const trace = [result.code, result.build].filter(Boolean).join(" · ");
  const message = result.error ?? "This reflection could not be saved.";

  return trace ? `${message} [${trace}]` : message;
}
