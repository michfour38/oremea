export type MirrorEmotion =
  | "frustration"
  | "exclusion"
  | "hurt"
  | "anger"
  | "grief"
  | "fear"
  | "relief"
  | "longing"

export function buildMirrorWhyQuestion({
  layer,
  sourceAnswer,
}: {
  layer: number
  sourceAnswer: string
}): string {
  const directAnswer = extractDirectAnswer(sourceAnswer)
  if (!directAnswer) return contextualWhy(layer, sourceAnswer)

  const secondPerson = resolveReferences(toSecondPerson(directAnswer), sourceAnswer)
  const emotion = detectMirrorEmotion(sourceAnswer)

  if (emotion === "frustration") {
    const tiredOf = secondPerson.match(/^you(?:'re| are) tired of (.+)$/i)
    if (tiredOf) {
      return `Why has ${lowercaseFirst(tiredOf[1])} become so frustrating?`
    }

    return `Why was it so frustrating to ${toInfinitiveExperience(secondPerson)}?`
  }

  const experience = toGerundExperience(secondPerson)

  if (emotion === "exclusion") {
    return `Why was ${experience} so hard to carry?`
  }

  if (emotion === "hurt") {
    return `Why did ${experience} hurt so much?`
  }

  if (emotion === "anger") {
    return `Why did ${experience} make you so angry?`
  }

  if (emotion === "grief") {
    return `Why did ${experience} carry so much grief?`
  }

  if (emotion === "fear") {
    return `Why was ${experience} so frightening?`
  }

  if (emotion === "relief") {
    return `Why did the relief in ${experience} matter to you?`
  }

  if (emotion === "longing") {
    return `Why did ${experience} matter so much to you?`
  }

  return layer % 2 === 0
    ? `Why was ${experience} important to you?`
    : `Why did ${experience} matter to you?`
}

export function extractDirectAnswer(input: string): string {
  const normalized = input.trim().replace(/\s+/g, " ")
  if (!normalized) return ""

  const fragments = normalized
    .match(/[^.!?]+[.!?]?/g)
    ?.map((part) => part.trim())
    .filter(Boolean) ?? [normalized]

  const statements = fragments
    .filter((part) => !part.endsWith("?"))
    .filter((part) => !/^(why|what|how|when|where|who|would|could|should)\b/i.test(part))
    .map((part) => part.replace(/^because\s+/i, "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean)

  const directStatements = statements.filter((part) =>
    /^(i\b|i['’]m\b|i am\b|i['’]ve\b|i have\b|i felt\b|i feel\b|i want\b|i need\b|i care\b|i believe\b|i thought\b|i was\b|my\b|me\b|it made me\b|that made me\b|that(?:['’]s| is) what\b|this(?:['’]s| is) what\b|it (?:was|is) because\b)/i.test(
      part,
    ),
  )

  return (directStatements.length > 0 ? directStatements : statements).join("; ")
}

export function detectMirrorEmotion(input: string): MirrorEmotion | null {
  const normalized = input.toLowerCase()
  const scores: Record<MirrorEmotion, number> = {
    frustration: score(normalized, [
      ["frustrat", 4],
      ["tired of", 3],
      ["sick of", 3],
      ["fed up", 4],
      ["why wouldn't", 3],
      ["why won’t", 3],
      ["why can't", 3],
      ["why can’t", 3],
      ["annoy", 3],
    ]),
    exclusion: score(normalized, [
      ["left out", 4],
      ["excluded", 4],
      ["didn't belong", 4],
      ["didn’t belong", 4],
      ["less than", 3],
      ["other kids", 2],
      ["everyone else", 2],
      ["didn't deserve", 3],
      ["didn’t deserve", 3],
      ["undeserving", 3],
    ]),
    hurt: score(normalized, [
      ["hurt", 4],
      ["painful", 4],
      ["rejected", 3],
      ["unwanted", 3],
      ["betrayed", 4],
    ]),
    anger: score(normalized, [
      ["angry", 4],
      ["furious", 5],
      ["rage", 5],
      ["mad", 3],
      ["unfair", 3],
      ["resent", 3],
    ]),
    grief: score(normalized, [
      ["grief", 5],
      ["grieving", 5],
      ["loss", 4],
      ["died", 4],
      ["gone", 2],
      ["miss ", 2],
    ]),
    fear: score(normalized, [
      ["afraid", 4],
      ["scared", 4],
      ["terrified", 5],
      ["frighten", 4],
      ["unsafe", 4],
      ["worried", 3],
      ["anxious", 3],
    ]),
    relief: score(normalized, [
      ["relief", 5],
      ["relieved", 5],
      ["finally", 2],
      ["no longer have to", 3],
    ]),
    longing: score(normalized, [
      ["longing", 5],
      ["yearn", 5],
      ["wish", 3],
      ["hope", 2],
      ["wanted", 2],
    ]),
  }

  const ranked = (Object.entries(scores) as [MirrorEmotion, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  return ranked[0]?.[0] ?? null
}

function score(input: string, signals: [string, number][]): number {
  return signals.reduce(
    (total, [signal, weight]) => total + (input.includes(signal) ? weight : 0),
    0,
  )
}

function contextualWhy(layer: number, sourceAnswer: string): string {
  const cleaned = sourceAnswer.trim().replace(/[.!?]+$/, "")
  if (cleaned) {
    const emotion = detectMirrorEmotion(cleaned)
    if (emotion === "frustration") return "Why is this becoming so frustrating?"
    if (emotion === "exclusion") return "Why is being left out carrying so much here?"
    if (emotion === "hurt") return "Why is this hurting so much?"
    if (emotion === "anger") return "Why is this making you so angry?"
    if (emotion === "grief") return "Why is this carrying so much grief?"
    if (emotion === "fear") return "Why is this feeling so frightening?"
  }

  const questions = [
    "Why does this matter to you right now?",
    "Why is that important to you?",
    "Why does that matter to you?",
    "Why is that important here?",
    "Why does that matter now?",
    "Why is that still important to you?",
    "Why does that matter beneath everything else you have named?",
  ]

  return questions[layer - 1] ?? questions[questions.length - 1]
}

function toSecondPerson(input: string): string {
  return input
    .trim()
    .replace(/^because\s+/i, "")
    .replace(/\bi['’]m\b/gi, "you're")
    .replace(/\bi am\b/gi, "you are")
    .replace(/\bi['’]ve\b/gi, "you've")
    .replace(/\bi['’]d\b/gi, "you'd")
    .replace(/\bmy\b/gi, "your")
    .replace(/\bme\b/gi, "you")
    .replace(/\bi\b/gi, "you")
}

function resolveReferences(answer: string, fullResponse: string): string {
  if (/other kids/i.test(fullResponse)) {
    return answer.replace(/what they had/gi, "what the other kids had")
  }

  return answer
}

function toInfinitiveExperience(input: string): string {
  const parts = input.split(/\s*;\s*/).filter(Boolean)
  return parts.map(toInfinitivePart).join(" and ")
}

function toInfinitivePart(input: string): string {
  const value = input.trim()

  return value
    .replace(/^you always felt like\s+/i, "keep feeling like ")
    .replace(/^you felt like\s+/i, "feel like ")
    .replace(/^you feel like\s+/i, "feel like ")
    .replace(/^you always felt\s+/i, "keep feeling ")
    .replace(/^you felt\s+/i, "feel ")
    .replace(/^you feel\s+/i, "feel ")
    .replace(/^you were\s+/i, "be ")
    .replace(/^you are\s+/i, "be ")
    .replace(/^you had to\s+/i, "have to ")
    .replace(/^you have to\s+/i, "have to ")
    .replace(/^you couldn't\s+/i, "not be able to ")
    .replace(/^you can’t\s+/i, "not be able to ")
    .replace(/^you\s+/i, "")
}

function toGerundExperience(input: string): string {
  const parts = input.split(/\s*;\s*/).filter(Boolean)
  return parts.map(toGerundPart).join(" and ")
}

function toGerundPart(input: string): string {
  const value = input.trim()

  if (/^that is what you constantly heard\b/i.test(value)) {
    return value.replace(/^that is what you constantly heard\b/i, "constantly hearing that")
  }

  return value
    .replace(/^you always felt like\s+/i, "always feeling like ")
    .replace(/^you felt like\s+/i, "feeling like ")
    .replace(/^you feel like\s+/i, "feeling like ")
    .replace(/^you always felt\s+/i, "always feeling ")
    .replace(/^you felt\s+/i, "feeling ")
    .replace(/^you feel\s+/i, "feeling ")
    .replace(/^you were\s+/i, "being ")
    .replace(/^you are\s+/i, "being ")
    .replace(/^you had to\s+/i, "having to ")
    .replace(/^you have to\s+/i, "having to ")
    .replace(/^you couldn't\s+/i, "not being able to ")
    .replace(/^you can’t\s+/i, "not being able to ")
    .replace(/^you wanted\s+/i, "wanting ")
    .replace(/^you needed\s+/i, "needing ")
    .replace(/^you\s+/i, "")
}

function lowercaseFirst(input: string): string {
  return input ? input.charAt(0).toLowerCase() + input.slice(1) : input
}
