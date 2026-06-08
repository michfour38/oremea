export type HarmonizeSystemMemory = {
  totalCycles: number
  reviewedCycles: number
  integrationCycles: number
  repetitionCycles: number
  mimicryCycles: number
}

export function buildSystemMemory(cycles: any[]): HarmonizeSystemMemory {
  let reviewedCycles = 0
  let integrationCycles = 0
  let repetitionCycles = 0
  let mimicryCycles = 0

  for (const cycle of cycles) {
    const outcome = cycle.reviews?.[0]?.outcome

    if (outcome) {
      reviewedCycles += 1
    }

    if (outcome === "integration") {
      integrationCycles += 1
    }

    if (outcome === "repetition") {
      repetitionCycles += 1
    }

    if (outcome === "mimicry") {
      mimicryCycles += 1
    }
  }

  return {
    totalCycles: cycles.length,
    reviewedCycles,
    integrationCycles,
    repetitionCycles,
    mimicryCycles,
  }
}