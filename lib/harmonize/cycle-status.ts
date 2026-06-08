export function isCycleClosed(status?: string) {
  return status === "reviewed" || status === "completed" || status === "archived"
}

export function cycleStatusMessage(status?: string) {
  if (status === "reviewed") {
    return "This cycle has already been reviewed. You can view it, but new work should begin in a new cycle."
  }

  if (status === "paused") {
    return "This cycle is currently paused."
  }

  if (status === "review_due") {
    return "This cycle is ready for review."
  }

  return null
}