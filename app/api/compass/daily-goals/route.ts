import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getCompassAccessState } from "@/src/lib/compass/compass-access"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
const MAX_GOAL_LENGTH = 500

type GoalRow = {
  id: string
  content: string
  scheduled_for: Date
  status: string
  completed_at: Date | null
  completed_on: Date | null
  archived_at: Date | null
  created_at: Date
  updated_at: Date
}

export async function GET(request: Request) {
  try {
    const access = await requireCompassAccess()
    if (access instanceof NextResponse) return access

    const url = new URL(request.url)
    const day = parseDay(url.searchParams.get("date")) ?? todayInJohannesburg()
    const goals = await readDayGoals(access.userId, day)

    return NextResponse.json({ goals })
  } catch (error) {
    console.error("GET /api/compass/daily-goals failed:", error)
    return NextResponse.json(
      { error: "Compass could not load today's goals." },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireCompassAccess()
    if (access instanceof NextResponse) return access

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null
    const action = typeof body?.action === "string" ? body.action : ""
    const day = parseDay(body?.date) ?? todayInJohannesburg()

    if (action === "add") {
      const content = cleanContent(body?.content)
      if (!content) {
        return NextResponse.json(
          { error: "Write the goal before adding it." },
          { status: 400 },
        )
      }

      await prisma.compass_daily_goals.create({
        data: {
          user_id: access.userId,
          content,
          scheduled_for: day,
        },
      })
    } else if (action === "complete") {
      const id = cleanId(body?.id)
      if (!id) return invalidGoal()

      const result = await prisma.compass_daily_goals.updateMany({
        where: {
          id,
          user_id: access.userId,
          status: { not: "archived" },
        },
        data: {
          status: "completed",
          completed_at: new Date(),
          completed_on: day,
          archived_at: null,
        },
      })

      if (result.count === 0) return invalidGoal()
    } else if (action === "restore") {
      const id = cleanId(body?.id)
      if (!id) return invalidGoal()

      const result = await prisma.compass_daily_goals.updateMany({
        where: { id, user_id: access.userId },
        data: {
          status: "active",
          scheduled_for: day,
          completed_at: null,
          completed_on: null,
          archived_at: null,
        },
      })

      if (result.count === 0) return invalidGoal()
    } else if (action === "edit") {
      const id = cleanId(body?.id)
      const content = cleanContent(body?.content)
      if (!id || !content) return invalidGoal()

      const result = await prisma.compass_daily_goals.updateMany({
        where: {
          id,
          user_id: access.userId,
          status: { not: "archived" },
        },
        data: { content },
      })

      if (result.count === 0) return invalidGoal()
    } else if (action === "archive") {
      const id = cleanId(body?.id)
      if (!id) return invalidGoal()

      const result = await prisma.compass_daily_goals.updateMany({
        where: { id, user_id: access.userId },
        data: {
          status: "archived",
          archived_at: new Date(),
        },
      })

      if (result.count === 0) return invalidGoal()
    } else {
      return NextResponse.json(
        { error: "Unknown daily goal action." },
        { status: 400 },
      )
    }

    const goals = await readDayGoals(access.userId, day)
    return NextResponse.json({ goals })
  } catch (error) {
    console.error("POST /api/compass/daily-goals failed:", error)
    return NextResponse.json(
      { error: "Compass could not update today's goals." },
      { status: 500 },
    )
  }
}

async function requireCompassAccess() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await getCompassAccessState(userId)).active) {
    return NextResponse.json({ error: "Compass access has ended." }, { status: 403 })
  }

  return { userId }
}

async function readDayGoals(userId: string, day: Date) {
  const rows = await prisma.compass_daily_goals.findMany({
    where: {
      user_id: userId,
      OR: [
        {
          status: "active",
          scheduled_for: { lte: day },
        },
        {
          status: "completed",
          completed_on: day,
        },
      ],
    },
    orderBy: [{ status: "asc" }, { scheduled_for: "asc" }, { created_at: "asc" }],
  })

  return rows.map(serializeGoal)
}

function serializeGoal(row: GoalRow) {
  return {
    id: row.id,
    content: row.content,
    scheduledFor: dateKey(row.scheduled_for),
    status: row.status,
    completedAt: row.completed_at?.toISOString() ?? null,
    completedOn: row.completed_on ? dateKey(row.completed_on) : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function parseDay(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_KEY.test(value)) return null

  const day = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(day.getTime()) ? null : day
}

function todayInJohannesburg() {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`)
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function cleanContent(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, MAX_GOAL_LENGTH)
}

function cleanId(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function invalidGoal() {
  return NextResponse.json({ error: "That goal could not be updated." }, { status: 404 })
}
