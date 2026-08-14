import { readFileSync } from "node:fs"

function read(path: string) {
  return readFileSync(path, "utf8")
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const model = read("prisma/schema/compass-daily-goals.prisma")
const migration = read(
  "prisma/migrations/20260810165500_add_compass_daily_goals/migration.sql",
)
const api = read("app/api/compass/daily-goals/route.ts")
const ui = read("app/compass/map/CompassDailyGoals.tsx")
const page = read("app/compass/map/page.tsx")

assert(
  model.includes("model compass_daily_goals") &&
    model.includes("user_id") &&
    model.includes("scheduled_for") &&
    model.includes("completed_on"),
  "Compass daily goals must have their own persistent per-user daily store.",
)
assert(
  !model.includes("compass_sessions"),
  "User-created daily goals must not be coupled to a single Compass session.",
)
assert(
  migration.includes('CREATE TABLE "compass_daily_goals"'),
  "Compass daily goals must ship with a production migration.",
)
assert(
  api.includes("getCompassAccessState") && api.includes("user_id: access.userId"),
  "Daily goals must be account-bound and Compass-access-gated.",
)
for (const action of ["add", "complete", "restore", "edit", "archive"]) {
  assert(
    api.includes(`action === "${action}"`),
    `Daily goals API must support ${action}.`,
  )
}
assert(
  api.includes('status: "active"') && api.includes("scheduled_for: { lte: day }"),
  "Unfinished daily goals must carry forward until completed or removed.",
)
assert(
  ui.includes("Add a goal for today") && ui.includes("Carried forward"),
  "The Map UI must support creating and carrying forward user goals.",
)
assert(
  /Compass does not add, rewrite, or\s+prioritise these for you\./.test(ui),
  "Compass must state that participant goals remain participant-authored.",
)
assert(
  page.includes("<CompassDailyGoals />") && page.includes("<CompassMapWorkspace />"),
  "The Map must present user-created Today goals alongside the existing Compass Map.",
)
assert(
  !ui.includes("slice(0,") && !ui.includes("MAX_GOALS"),
  "The Today UI must not impose an arbitrary number-of-goals cap.",
)

console.log("Compass daily goals contract checks passed.")
