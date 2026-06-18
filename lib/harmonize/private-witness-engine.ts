type PrivateWitnessEntry = {
  content: string
}

function latest(entries: PrivateWitnessEntry[]) {
  return entries[entries.length - 1]?.content?.toLowerCase() || ""
}

export function privateWitnessEngine(entries: PrivateWitnessEntry[]) {
  const text = latest(entries)

  if (entries.length === 0) {
    return {
      nextQuestion: "Tell me what happened.",
      readyForSharedSpace: false,
    }
  }

  if (
    text.includes("message") ||
    text.includes("writes") ||
    text.includes("writing") ||
    text.includes("text")
  ) {
    return {
      nextQuestion:
        "What changes for you when he writes instead of talks?",
      readyForSharedSpace: false,
    }
  }

  if (
    text.includes("talks at me") ||
    text.includes("in my face") ||
    text.includes("face to face")
  ) {
    return {
      nextQuestion:
        "When he talks at you, what becomes difficult that seems easier in writing?",
      readyForSharedSpace: false,
    }
  }

  if (
    text.includes("call") ||
    text.includes("called")
  ) {
    return {
      nextQuestion:
        "If the call had happened, what would the conversation have sounded like?",
      readyForSharedSpace: false,
    }
  }

  if (
    text.includes("chosen") ||
    text.includes("choose")
  ) {
    return {
      nextQuestion:
        "When you imagine being chosen here, what does being chosen look like to you?",
      readyForSharedSpace: false,
    }
  }

  if (entries.length >= 6) {
    return {
      nextQuestion:
        "What feels safe enough to bring into shared space, and what would you prefer to keep private?",
      readyForSharedSpace: true,
    }
  }

  return {
    nextQuestion:
      "What part of that feels most important to stay with?",
    readyForSharedSpace: false,
  }
}