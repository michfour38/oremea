import type { CompassAreaResponse } from "./session-types"

export type DependencyCluster = {
  label: string
  kind:
    | "project"
    | "resource"
    | "relationship"
    | "experience"
    | "unknown"
  score: number
  supportingAreas: string[]
  supportingPhrases: string[]
}

const PROJECT_TERMS = [
  "oremea",
  "business",
  "application",
  "app",
  "product",
  "products",
  "offerings",
  "directories",
  "channel",
  "program",
  "books",
  "animated",
  "launched",
]

const RESOURCE_TERMS = [
  "income",
  "earning",
  "earn",
  "money",
  "afford",
  "sustainable",
  "running solo",
  "heirs",
  "transferable",
  "support myself",
]

const RELATIONSHIP_TERMS = [
  "children",
  "family",
  "partner",
  "relationship",
  "intimate",
  "lovers",
]

const EXPERIENCE_TERMS = [
  "travel",
  "holidays",
  "getaways",
  "restaurants",
  "art",
  "classes",
  "gym",
  "hyrox",
  "retreats",
]

export function detectDependencyClusters(
  responses: CompassAreaResponse[],
): DependencyCluster[] {
  const clusters: DependencyCluster[] = [
    buildCluster({
      label: detectProjectLabel(responses) ?? "Project",
      kind: "project",
      terms: PROJECT_TERMS,
      responses,
    }),
    buildCluster({
      label: "Income",
      kind: "resource",
      terms: RESOURCE_TERMS,
      responses,
    }),
    buildCluster({
      label: "Relationships",
      kind: "relationship",
      terms: RELATIONSHIP_TERMS,
      responses,
    }),
    buildCluster({
      label: "Experiences",
      kind: "experience",
      terms: EXPERIENCE_TERMS,
      responses,
    }),
  ]

  const projectCluster = clusters.find(
  (cluster) =>
    cluster.kind === "project" &&
    cluster.label === "Oremea",
)

const incomeCluster = clusters.find(
  (cluster) =>
    cluster.kind === "resource" &&
    cluster.label === "Income",
)

if (
  projectCluster &&
  incomeCluster &&
  projectCluster.score >= 3
) {
  projectCluster.score += incomeCluster.score
}

return clusters
  .filter((cluster) => cluster.score > 0)
  .sort((a, b) => b.score - a.score)
}

function buildCluster({
  label,
  kind,
  terms,
  responses,
}: {
  label: string
  kind: DependencyCluster["kind"]
  terms: string[]
  responses: CompassAreaResponse[]
}): DependencyCluster {
  const supportingAreas = new Set<string>()
  const supportingPhrases: string[] = []

  for (const response of responses) {
    const answer = response.answer.toLowerCase()

    for (const term of terms) {
      if (answer.includes(term)) {
        supportingAreas.add(response.area)

        if (supportingPhrases.length < 5) {
          supportingPhrases.push(cleanReference(response.answer))
        }

        break
      }
    }
  }

  return {
    label,
    kind,
    score: supportingAreas.size,
    supportingAreas: [...supportingAreas],
    supportingPhrases,
  }
}

function detectProjectLabel(
  responses: CompassAreaResponse[],
): string | null {
  const joined = responses
    .map((response) => response.answer)
    .join(" ")

  const projectMatch = joined.match(/\bOremea\b/i)

  if (projectMatch) {
    return "Oremea"
  }

  return null
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ")

  if (trimmed.length <= 140) {
    return trimmed
  }

  return `${trimmed.slice(0, 140)}...`
}

export function formatAreaList(areas: string[]): string {
  const formatted = areas.map(formatArea)

  if (formatted.length === 0) return ""
  if (formatted.length === 1) return formatted[0]
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`

  return `${formatted.slice(0, -1).join(", ")}, and ${
    formatted[formatted.length - 1]
  }`
}

function formatArea(area: string): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}