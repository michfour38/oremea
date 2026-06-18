type PrivateWitnessEntry = {
  content: string
}

const fallbackQuestion =
  "What feels most important about what you just named?"

export function generatePrivateWitnessQuestion(
  entries: PrivateWitnessEntry[],
) {
  const text = entries
    .map((entry) => entry.content)
    .join(" ")
    .toLowerCase()

  if (!text.trim()) {
    return "Tell me what happened."
  }

  if (
    text.includes("ignored") ||
    text.includes("left") ||
    text.includes("abandoned") ||
    text.includes("disappeared")
  ) {
    return "What did their absence mean to you?"
  }

  if (
    text.includes("always") ||
    text.includes("never") ||
    text.includes("every time") ||
    text.includes("again")
  ) {
    return "What pattern are you noticing?"
  }

  if (
    text.includes("hurt") ||
    text.includes("pain") ||
    text.includes("angry") ||
    text.includes("frustrated")
  ) {
    return "What feels most important about that experience?"
  }

  if (
    text.includes("confused") ||
    text.includes("unclear") ||
    text.includes("mixed")
  ) {
    return "What feels unclear inside this?"
  }

  if (
    text.includes("scared") ||
    text.includes("afraid") ||
    text.includes("unsafe")
  ) {
    return "What part of you is trying to feel safe?"
  }

  return fallbackQuestion
}