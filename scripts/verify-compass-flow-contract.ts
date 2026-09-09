import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import {
  COMPASS_DESCENT_LAYER_COUNT,
  COMPASS_PHASE_PURPOSE,
  COMPASS_PRIMARY_FLOW,
} from "../src/lib/compass/session/compass-flow-contract"

function read(path: string) {
  return readFileSync(path, "utf8")
}

assert.equal(
  COMPASS_DESCENT_LAYER_COUNT,
  7,
  "Compass must preserve all seven Why layers.",
)
assert.deepEqual(
  COMPASS_PRIMARY_FLOW,
  [
    "intro",
    "area",
    "area_mirror",
    "area_confirmation",
    "depth_intro",
    "depth",
    "core_reflection",
    "discussion",
  ],
  "Compass must keep one legible route from orientation to participant-owned movement.",
)

for (const phase of COMPASS_PRIMARY_FLOW) {
  assert.ok(
    COMPASS_PHASE_PURPOSE[phase].trim(),
    `Compass phase ${phase} must have one explicit product purpose.`,
  )
}

const page = read("app/compass/page.tsx")
const depth = read("components/compass/CompassDepthFlow.tsx")
const discussion = read("components/compass/CompassDiscussionFlow.tsx")
const stageCopy = read("src/lib/compass/session/session-stage-copy.ts")
const conversationEngine = read("src/lib/el/conversation-engine.ts")
const endingEngine = read("src/lib/compass/ending/ending-engine.ts")

assert.match(
  depth,
  /COMPASS_DESCENT_LAYER_COUNT/,
  "The Descent UI must use the locked seven-layer contract.",
)
assert.match(
  page,
  /updated\.length < COMPASS_DESCENT_LAYER_COUNT/,
  "Compass must remain in the Descent until all seven accepted Why layers exist.",
)
assert.match(
  page,
  /await generateCompassMirror\(updated\);\s*setPhase\("core_reflection"\)/,
  "The seventh Why answer must move to Core Reflection.",
)
assert.match(
  page,
  /onContinue=\{beginDiscussion\}/,
  "Accepting Core Reflection must enter Discussion directly.",
)
assert.match(
  page,
  /function beginDiscussion\(savedMirror: string\)[\s\S]*content: acceptedMirror[\s\S]*setPhase\("discussion"\)/,
  "Discussion must begin from the accepted Core Reflection and its live question.",
)
assert.doesNotMatch(
  page,
  /CompassPromptFlow|possibilityQuestion|submitPossibilityAnswer|setPhase\("possibility|\{phase === "possibility/,
  "No mandatory questionnaire may sit between Core Reflection and Discussion.",
)
assert.match(
  page,
  /value === "possibility" \|\|[\s\S]*value === "possibility_mirror" \|\|[\s\S]*return "discussion"/,
  "Saved runs from the removed questionnaire must resume in Discussion.",
)
assert.doesNotMatch(
  page,
  /setPhase\("resistance"\)|evaluatePriorityRedirect|mapResistance|evaluateResonanceBridge/,
  "The live flow must not auto-label resistance, redirect the participant's chosen area, or auto-promote another product.",
)

assert.doesNotMatch(
  discussion,
  /export function CompassComplete|resonanceCtaHref|Explore Resonance/,
  "Dead automatic promotion UI must not remain available to re-enter the Compass flow.",
)
assert.doesNotMatch(
  read("components/compass/CompassResistanceFlow.tsx"),
  /export function CompassResistanceFlow/,
  "The removed resistance phase must not remain as a callable legacy component.",
)
assert.match(
  read("components/compass/CompassResistanceFlow.tsx"),
  /savedCoreMirror \|\| fallbackReflection \|\| MIRROR_UNAVAILABLE/,
  "Core Reflection must preserve a participant-evidence fallback instead of trapping the participant in a generation retry.",
)
assert.match(
  read("components/compass/CompassResistanceFlow.tsx"),
  /const acceptedMirror = savedCoreMirror \|\| fallbackReflection;[\s\S]*onContinue\(acceptedMirror\)/,
  "Core Reflection Continue must accept the participant-grounded fallback instead of becoming an enabled no-op.",
)
assert.match(
  read("components/compass/CompassResistanceFlow.tsx"),
  /Continue to Discussion/,
  "The Core Reflection button must name its direct destination.",
)

assert.match(
  stageCopy,
  /all seven Why layers[\s\S]*Possibility, planning, and action wait/,
  "The seven Why layers must remain a bounded Descent rather than being removed.",
)
assert.doesNotMatch(
  stageCopy,
  /nervous-system friction|avoidance patterns|emotional structures/i,
  "Compass stage purpose must not be flattened into psychological Recognition or Resonance language.",
)
assert.match(
  conversationEngine,
  /completed all seven Why layers/,
  "Discussion intelligence must know the full Descent is complete.",
)
assert.doesNotMatch(
  conversationEngine,
  /possibility-course answers|named a resource and an available strength/i,
  "Discussion must not pretend the participant completed the removed questionnaire.",
)
assert.doesNotMatch(
  endingEngine,
  /POSSIBILITY RESPONSES|Possibility-course answers|named a resource and an available strength/i,
  "The ending must not depend on answers from the removed questionnaire.",
)
assert.match(
  endingEngine,
  /participant-confirmed resolution[\s\S]*remains theirs to edit or reject/,
  "Ending intelligence must not become the chooser.",
)

const buttonDestinations: Array<[RegExp, string]> = [
  [/onClick=\{\(\) => setView\("discussion"\)\}/, "Discussion tab"],
  [/onClick=\{\(\) => void openMap\(\)\}/, "Map tab"],
  [/onClick=\{onSend\}/, "Continue discussion"],
  [/onClick=\{\(\) => void finishDiscussion\(\)\}/, "Pause and save"],
  [/onClick=\{\(\) => void prepareResolution\(\)\}/, "Reach a resolution"],
  [/onClick=\{\(\) => void confirmResolution\(\)\}/, "Confirm resolution"],
  [/onFinalize=\{confirmFinalDraft\}/, "Pass movement review destination"],
  [/onClick=\{onFinalize\}/, "Review movement"],
  [/onClick=\{\(\) => void finishCompass\(\)\}/, "Choose and save movement"],
  [/onClick=\{\(\) => void completeMovement\(\)\}/, "Complete movement"],
  [/onClick=\{\(\) => void movementFeedback\("easier"\)\}/, "Make it easier"],
  [/onClick=\{\(\) => void movementFeedback\("blocked"\)\}/, "Something is in the way"],
  [/onClick=\{\(\) => void movementFeedback\("wrong"\)\}/, "Reject movement"],
  [/onClick=\{\(\) => jumpToDiscussion\(item\)\}/, "Return to source discussion"],
  [/onClick=\{\(\) => void editMapItem\(item\)\}/, "Edit Map item"],
  [/onClick=\{\(\) => void releaseMapItem\(item\)\}/, "Release Map item"],
]

for (const [pattern, label] of buttonDestinations) {
  assert.match(
    discussion,
    pattern,
    `${label} must remain wired to its intended function.`,
  )
}

assert.match(
  discussion,
  /disabled=\{!discussionInput\.trim\(\) \|\| discussionSending\}/,
  "Continue discussion must not present an enabled no-op button.",
)
assert.match(
  discussion,
  /disabled=\{!executionFeeling\.trim\(\)\}/,
  "Movement review must disable blank no-op submissions.",
)
assert.match(
  discussion,
  /window\.location\.assign\("https:\/\/www\.oremea\.com"\)/,
  "Finish and Return buttons must leave the Compass run for Oremea.",
)

for (const [path, required] of [
  ["middleware.ts", "rewriteCompassPath"],
  ["app/compass/access/page.tsx", 'href="/begin"'],
  ["src/lib/compass/compass-commerce.ts", "isCompassSubscriptionFulfillmentConfigured"],
  ["app/compass/archive/page.tsx", "CompassArchiveWheel"],
  ["app/compass/archive/session/[id]/page.tsx", "canRestoreToMap={access.active}"],
  ["app/compass/map/page.tsx", "CompassMapWorkspace"],
  ["app/api/compass/ending/route.ts", 'action === "confirm_map"'],
  ["app/api/compass/session/route.ts", "validateCompassCompletion"],
] as const) {
  assert.ok(
    read(path).includes(required),
    `${path} must preserve its Compass infrastructure responsibility.`,
  )
}

console.log("Compass flow and button contract checks passed.")
