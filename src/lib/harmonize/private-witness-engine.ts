import { buildWitnessQuestion } from "./witness-question-engine"
import type { AnchorDefinition } from "./anchor-definition-engine"
import {
  getStrongestWitnessSignal,
  type WitnessSignal,
} from "./witness-signal-engine"

type PrivateWitnessEntry = {
  content: string
}

type PrivateWitnessEngineResult = {
  nextQuestion: string
  readyForSharedSpace: boolean
  anchorDefinition: AnchorDefinition | null
  strongestSignal: WitnessSignal | null
  witnessTrail: string[]
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function short(text: string) {
  const cleaned = clean(text)
  return cleaned.length > 120 ? `${cleaned.slice(0, 120)}...` : cleaned
}

function buildWitnessTrail(entries: PrivateWitnessEntry[]) {
  return entries.map((entry) => short(entry.content)).filter(Boolean)
}

export function privateWitnessEngine(
  entries: PrivateWitnessEntry[],
): PrivateWitnessEngineResult {
  const witnessTrail = buildWitnessTrail(entries)
  const strongestSignal = getStrongestWitnessSignal(entries)

  if (!strongestSignal) {
    return {
      nextQuestion: "Tell me what happened.",
      readyForSharedSpace: false,
      anchorDefinition: null,
      strongestSignal: null,
      witnessTrail,
    }
  }

  const anchorDefinition = strongestSignal.anchorDefinition

  const enoughBehavioralDefinition =
    anchorDefinition.behavioralMarkers.length >= 3 &&
    anchorDefinition.confidence >= 0.7

  return {
    nextQuestion: buildWitnessQuestion(anchorDefinition),
    readyForSharedSpace: enoughBehavioralDefinition && entries.length >= 4,
    anchorDefinition,
    strongestSignal,
    witnessTrail,
  }
}