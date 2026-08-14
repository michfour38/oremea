import { validateCompassCompletion } from "../src/lib/compass/session/completion-contract"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const missingResolution = validateCompassCompletion({
  resolutionText: "",
  resolutionConfirmedAt: null,
  finalStep: "Send the brief",
})

assert(!missingResolution.ok, "Compass must reject completion without a resolution.")

const unconfirmedResolution = validateCompassCompletion({
  resolutionText: "I am choosing the smaller launch.",
  resolutionConfirmedAt: null,
  finalStep: "Send the brief",
})

assert(
  !unconfirmedResolution.ok,
  "Compass must reject model wording the participant did not confirm.",
)

const missingMovement = validateCompassCompletion({
  resolutionText: "I am choosing the smaller launch.",
  resolutionConfirmedAt: new Date(),
  finalStep: "",
})

assert(!missingMovement.ok, "Compass must reject completion without a movement.")

const confirmed = validateCompassCompletion({
  resolutionText: "  I am choosing the smaller launch.  ",
  resolutionConfirmedAt: new Date(),
  finalStep: "  Send the brief to the first three providers.  ",
})

assert(confirmed.ok, "Compass must accept a confirmed resolution and movement.")
assert(
  confirmed.resolutionText === "I am choosing the smaller launch.",
  "Compass must preserve the participant-confirmed resolution.",
)
assert(
  confirmed.finalStep === "Send the brief to the first three providers.",
  "Compass must preserve the participant-confirmed movement.",
)

console.log("Compass resolution contract checks passed.")
