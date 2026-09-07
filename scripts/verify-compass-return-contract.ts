import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"

import {
  buildCompassReturnOpening,
  carryCompassEndingStateForReturn,
} from "../src/lib/compass/session/return-contract"

function read(path: string) {
  return readFileSync(path, "utf8")
}

const opening = buildCompassReturnOpening({
  resolutionText: "I am choosing the smaller paid pilot.",
  chosenMovement: "Send the pilot invitation to the first creator.",
})

assert.match(opening, /Last time, you resolved:/)
assert.match(opening, /I am choosing the smaller paid pilot\./)
assert.match(opening, /You chose this movement:/)
assert.match(opening, /Send the pilot invitation to the first creator\./)
assert.match(
  opening,
  /What actually happened, and what has changed since we last spoke\?/,
  "A voluntary Compass return must begin with reality, not a fresh engagement loop.",
)
assert.equal(
  buildCompassReturnOpening({
    resolutionText: null,
    chosenMovement: null,
  }),
  "What has changed since we last spoke?",
)

const carried = carryCompassEndingStateForReturn({
  storedState: {
    version: 1,
    selectedArea: "income",
    mapItems: [
      {
        id: "map-1",
        content: "Build the paid pilot",
        kind: "goal",
        ownership: "mine",
        status: "active",
        area: "income",
        sourceMessageIndex: 2,
        sourceSnippet: "paid pilot",
        createdAt: "2026-09-01T00:00:00.000Z",
        completedAt: null,
      },
    ],
    movements: [
      {
        id: "movement-1",
        mapItemId: "map-1",
        instruction: "Draft the invitation.",
        reason: null,
        status: "active",
        createdAt: "2026-09-01T00:00:00.000Z",
        completedAt: null,
      },
    ],
    currentMovementId: "movement-1",
  },
  chosenMovement: "Send the pilot invitation to the first creator.",
  movementId: "unused-new-id",
  now: "2026-09-07T00:00:00.000Z",
})

assert.equal(carried.mapItems.length, 1, "The working Map must survive a return.")
assert.equal(
  carried.currentMovementId,
  "movement-1",
  "The participant's last chosen movement must remain the return evidence.",
)
assert.equal(
  carried.movements[0]?.instruction,
  "Send the pilot invitation to the first creator.",
  "The participant-confirmed movement must outrank the earlier generated draft.",
)
assert.equal(carried.mapReviewed, false)
assert.equal(carried.resolutionConfirmed, false)
assert.equal(carried.movementReady, false)
assert.equal(carried.discussionCount, 1)

const sessionRoute = read("app/api/compass/session/route.ts")
const card = read("components/compass/CompassCard.tsx")
const conclusion = read("components/compass/CompassDiscussionFlow.tsx")
const mapPage = read("app/compass/map/page.tsx")
const conversation = read("src/lib/el/conversation-engine.ts")
const packageJson = read("package.json")
const schema = read("prisma/schema/compass-daily-goals.prisma")

assert.match(sessionRoute, /buildCompassReturnOpening/)
assert.match(sessionRoute, /carryCompassEndingStateForReturn/)
assert.doesNotMatch(
  sessionRoute,
  /content: "What has your attention now\?"/,
  "A returning participant must not be treated as a context-free new engagement.",
)
assert.match(card, /Return with what actually happened/)
assert.match(card, /Return only because reality changed/)
assert.match(conclusion, /title="Resolved\. Movement chosen\."/)
assert.match(conclusion, />\s*Resolved\s*</)
assert.match(conclusion, />\s*My next movement\s*</)
assert.match(conclusion, /No check-in is required/)
assert.match(conclusion, /Leave Compass and move/)
assert.doesNotMatch(mapPage, /CompassDailyGoals|Today holds/)
assert.match(mapPage, /not a daily checklist, streak, or accountability routine/)
assert.match(conversation, /EPISODIC RETURN/)
assert.match(conversation, /current reality wins/)
assert.match(conversation, /purpose of return is progression, not repetition/)
assert.match(packageJson, /test:compass-return/)
assert.doesNotMatch(packageJson, /test:compass-daily-goals/)
assert.equal(existsSync("app/compass/map/CompassDailyGoals.tsx"), false)
assert.equal(existsSync("app/api/compass/daily-goals/route.ts"), false)
assert.match(
  schema,
  /model compass_daily_goals/,
  "Removing the daily loop must not destroy previously stored participant data.",
)

console.log("Compass embodied conclusion and episodic return checks passed.")
