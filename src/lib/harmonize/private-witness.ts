type PrivateWitnessEntry = {
  content: string
}

function latestEntry(entries: PrivateWitnessEntry[]) {
  return entries[0]?.content?.trim() || ""
}

function excerpt(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim()
  return cleaned.length > 90 ? `${cleaned.slice(0, 90)}...` : cleaned
}

export function generatePrivateWitnessQuestion(entries: PrivateWitnessEntry[]) {
  const latest = latestEntry(entries)
  const text = latest.toLowerCase()
  const quote = excerpt(latest)

  if (!latest) {
    return "Tell me what happened."
  }

  if (
    text.includes("ignored") ||
    text.includes("left") ||
    text.includes("abandoned") ||
    text.includes("disappeared")
  ) {
    return `You named “${quote}”. What did their absence mean to you?`
  }

  if (
    text.includes("always") ||
    text.includes("never") ||
    text.includes("every time") ||
    text.includes("again")
  ) {
    return `You named “${quote}”. What pattern are you noticing?`
  }

  if (
    text.includes("hurt") ||
    text.includes("pain") ||
    text.includes("angry") ||
    text.includes("frustrated")
  ) {
    return `You named “${quote}”. What feels most important about that experience?`
  }

  if (
    text.includes("confused") ||
    text.includes("unclear") ||
    text.includes("mixed")
  ) {
    return `You named “${quote}”. What feels unclear inside this?`
  }

  if (
    text.includes("scared") ||
    text.includes("afraid") ||
    text.includes("unsafe")
  ) {
    return `You named “${quote}”. What part of you is trying to feel safe?`
  }

  return `You named “${quote}”. What feels most important here?`
}