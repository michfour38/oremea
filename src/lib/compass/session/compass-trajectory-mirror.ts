import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "./session-types"

const AREA_LABELS: Record<CompassGoalArea, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
}

export function buildCompassTrajectoryMirror({
  areaResponses,
  selectedArea,
  recursiveLayers,
}: {
  areaResponses: CompassAreaResponse[]
  selectedArea: CompassGoalArea | null
  recursiveLayers: CompassRecursiveLayer[]
}): string {
  const selectedAreaLabel = selectedArea
    ? AREA_LABELS[selectedArea]
    : "the area you chose"

  const selectedAreaAnswer =
    areaResponses.find((response) => response.area === selectedArea)?.answer.trim() ??
    ""

  const usableLayers = recursiveLayers.filter((layer) => layer.answer.trim())

  if (usableLayers.length === 0) {
    return selectedAreaAnswer
      ? `You began in ${selectedAreaLabel} with: “${cleanReference(selectedAreaAnswer)}”`
      : "Compass needs more of your own words before it can reflect the Descent back accurately."
  }

  const firstLayer = usableLayers[0]
  const middleLayer = usableLayers[Math.floor((usableLayers.length - 1) / 2)]
  const finalLayer = usableLayers[usableLayers.length - 1]

  const pieces = [
    `You began in ${selectedAreaLabel}${selectedAreaAnswer ? ` with: “${cleanReference(selectedAreaAnswer)}”` : "."}`,
    firstLayer
      ? `At the first layer, you wrote: “${cleanReference(firstLayer.answer)}”`
      : null,
    middleLayer && middleLayer.layer !== firstLayer?.layer && middleLayer.layer !== finalLayer?.layer
      ? `Further down, you wrote: “${cleanReference(middleLayer.answer)}”`
      : null,
    finalLayer
      ? `By Layer ${finalLayer.layer}, your own words had arrived here: “${cleanReference(finalLayer.answer)}”`
      : null,
    "The starting area tells Compass where the Descent began. Your answers show where the thread went.",
    "What has your attention now that you can see that path together?",
  ].filter((value): value is string => Boolean(value))

  return pieces.join("\n\n")
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ")

  if (trimmed.length <= 260) {
    return trimmed
  }

  return `${trimmed.slice(0, 260)}...`
}
