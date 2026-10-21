/** Allowlisted diagnostics only: never serialize messages, stacks, bodies, causes or URLs. */
export function privateErrorMetadata(error: unknown): { code?: string; status?: number } {
  try {
    if (!error || typeof error !== "object") return {};
    const { code, status } = error as { code?: unknown; status?: unknown };
    return {
      ...(typeof code === "string" && /^P\d{4}$/.test(code) ? { code } : {}),
      ...(typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599
        ? { status } : {}),
    };
  } catch { return {}; }
}

// Callers must supply a static event label, never participant text or an error message.
export function logPrivateError(event: string, error?: unknown) {
  console.error(event, privateErrorMetadata(error));
}
