export const MEANING_DIRECTIONS = [
  "others_to_others",
  "others_to_self",
  "self_to_self",
  "self_to_others",
] as const

export type MeaningDirection = (typeof MEANING_DIRECTIONS)[number]

export const MEANING_MOVEMENTS = [
  "new_meaning",
  "repetition",
  "correction",
  "uncertainty_only",
  "uncertainty_with_answer",
  "compound_meaning",
] as const

export type MeaningMovement = (typeof MEANING_MOVEMENTS)[number]

export const MEANING_ANSWER_FORMS = [
  "meaning",
  "memory",
  "external_circumstance",
  "strategy",
  "desired_outcome",
  "emotion",
  "value",
  "identity",
  "obligation",
  "prevention",
  "comparison",
  "self_judgment",
  "inherited_rule",
  "other",
] as const

export type MeaningAnswerForm = (typeof MEANING_ANSWER_FORMS)[number]

export const MEANING_MOVEMENT_STANDARD = `
MEANING MOVEMENT STANDARD

DIRECTION
Classify the substantive answer by the direction in which meaning is moving.

- others_to_others: one person acting toward, speaking about, giving to, withholding from, or affecting another person
- others_to_self: another person or group acting toward, speaking to, giving to, withholding from, or communicating something to the participant
- self_to_self: the participant's own feeling, belief, identity, judgment, value, need, conclusion, desire, or inner rule
- self_to_others: what the participant wants to give, prevent, create, communicate, embody, or make available for another person

Direction is a routing boundary, not a psychological interpretation.

MOVEMENT
Decide whether the participant's response contains a genuine movement in meaning.

- new_meaning: a new reason, value, belief, feeling, identity, memory, significance, need, or connection appears
- repetition: the same meaning is restated, even when the wording changes
- correction: the participant explicitly replaces or corrects an earlier meaning, such as "no, I said...", "that is not what I meant", or "actually..."
- uncertainty_only: uncertainty appears without any substantive answer
- uncertainty_with_answer: uncertainty opens the response, but a substantive answer follows
- compound_meaning: two or more genuine answers belong together and share one deeper thread

A text submission is not automatically a movement.
A changed sentence is not automatically a changed meaning.
Repetition is data, not progress.
A correction replaces; it does not add.
"I don't know" does not advance when nothing substantive follows.
"I don't know, maybe..." may advance when the words after it contain genuine meaning.

SUBSTANTIVE ANSWER
Extract the smallest complete thought or joined set of thoughts that actually answers the question.

- preserve the participant's living language
- use surrounding material only to resolve references or cadence
- rhetorical questions, accusations, examples, side explanations, and speculation about another person's motives remain context unless they themselves contain the direct answer
- when the participant corrects themselves, use the corrected meaning and do not combine it with what they withdrew
- when a circumstance and its meaning both appear, follow the meaning
- when only a circumstance appears, preserve it as the reason given without investigating why the circumstance happened
`.trim()

export function isMeaningDirection(value: unknown): value is MeaningDirection {
  return (
    typeof value === "string" &&
    (MEANING_DIRECTIONS as readonly string[]).includes(value)
  )
}

export function isMeaningMovement(value: unknown): value is MeaningMovement {
  return (
    typeof value === "string" &&
    (MEANING_MOVEMENTS as readonly string[]).includes(value)
  )
}

export function isMeaningAnswerForm(value: unknown): value is MeaningAnswerForm {
  return (
    typeof value === "string" &&
    (MEANING_ANSWER_FORMS as readonly string[]).includes(value)
  )
}
