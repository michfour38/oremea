import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import {
  COMPASS_DESCENT_LAYER_COUNT,
  COMPASS_PHASE_PURPOSE,
  COMPASS_POSSIBILITY_STEP_COUNT,
  COMPASS_PRIMARY_FLOW,
} from "../src/lib/compass/session/compass-flow-contract"
import {
  buildPossibilityMirror,
  COMPASS_POSSIBILITY_QUESTIONS,
  getPossibilityQuestion,
} from "../src/lib/compass/session/possibility-expansion"

function read(path: string) {
  return readFileSync(path, "utf8")
}

assert.equal(
  COMPASS_DESCENT_LAYER_COUNT,
  7,
  "Compass must preserve all seven Why layers.",
)
assert.equal(
  COMPASS_POSSIBILITY_STEP_COUNT,
  4,
  "The post-Descent course must preserve resource, strength/support, possibilities, and participant choice.",
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
    "possibility",
    "possibility_mirror",
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

assert.equal(
  COMPASS_POSSIBILITY_QUESTIONS.length,
  COMPASS_POSSIBILITY_STEP_COUNT,
  "Every post-Descent possibility purpose must have one question.",
)
assert.match(
  getPossibilityQuestion({ selectedArea: "income", index: 0 }).question,
  /resource/i,
  "Possibility step one must ask for a resource.",
)
assert.match(
  getPossibilityQuestion({ selectedArea: "income", index: 1 }).question,
  /strength|support/i,
  "Possibility step two must ask what is already available.",
)
assert.match(
  getPossibilityQuestion({ selectedArea: "income", index: 2 }).question,
  /possibilities/i,
  "Possibility step three must make real possibilities visible.",
)
assert.match(
  getPossibilityQuestion({ selectedArea: "income", index: 3 }).question,
  /choosing/i,
  "Possibility step four must leave the choice with the participant.",
)

const possibilityMirror = buildPossibilityMirror({
  selectedArea: "income",
  possibilityAnswers: [
    "Two uninterrupted mornings",
    "I already know the customers",
    "A smaller paid pilot or a partner launch",
    "I am choosing the smaller paid pilot",
  ],
})

for (const participantPhrase of [
  "Two uninterrupted mornings",
  "I already know the customers",
  "A smaller paid pilot or a partner launch",
  "I am choosing the smaller paid pilot",
]) {
  assert.match(
    possibilityMirror,
    new RegExp(participantPhrase),
    "The possibility mirror must preserve every participant-written answer.",
  )
}

const page = read("app/compass/page.tsx")
const depth = read("components/compass/CompassDepthFlow.tsx")
const discussion = read("components/compass/CompassDiscussionFlow.tsx")
const promptFlow = read("components/compass/CompassPromptFlow.tsx")
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
  /onContinue=\{\(savedMirror\) => \{[\s\S]*setPhase\("possibility"\)/,
  "Accepting Core Reflection must begin the post-Descent possibility course.",
)
assert.match(
  page,
  /updated\.length < COMPASS_POSSIBILITY_STEP_COUNT/,
  "All four possibility purposes must be completed.",
)
assert.match(
  page,
  /setPhase\("possibility_mirror"\)/,
  "The participant must review the chosen direction before Discussion.",
)
assert.match(
  page,
  /onClick=\{beginCompletedReality\}[\s\S]*Yes — describe the completed reality/,
  "The chosen-direction confirmation button must enter completed-reality Discussion.",
)
assert.match(
  page,
  /onClick=\{revisePossibilityChoice\}[\s\S]*Change my chosen possibility/,
  "The correction button must return to the participant's choice.",
)
assert.match(
  page,
  /This has already happened\. What is now true in observable terms\?/,
  "Discussion must begin by asking for completed reality rather than more Recognition.",
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
assert.match(
  conversationEngine,
  /possibility-course answers preserve the participant/i,
  "Discussion intelligence must preserve resource, strength/support, possibilities, and choice.",
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
  [/onClick=\{confirmFinalDraft\}/, "Review movement"],
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
  promptFlow,
  /disabled=\{!value\.trim\(\)\}/,
  "Every open Compass prompt must disable blank no-op submissions.",
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
  ["src/lib/compass/compass-commerce.ts", "COMPASS_SUBSCRIPTION_CHECKOUT_URL"],
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
