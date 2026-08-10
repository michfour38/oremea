import { execFile } from "node:child_process"
import path from "node:path"
import { promisify } from "node:util"

import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const execFileAsync = promisify(execFile)
const DEADLINE = Date.parse("2026-08-10T18:30:00Z")
const MIGRATION = "20260810132000_add_recognition_conversation"
const PRISMA_SCHEMA = "prisma"

type MigrationRow = {
  started_at: Date
  finished_at: Date | null
  rolled_back_at: Date | null
  logs: string | null
}

function isAllowed(request: Request) {
  const url = new URL(request.url)
  const suppliedSha = url.searchParams.get("sha")
  const deployedSha = process.env.RAILWAY_GIT_COMMIT_SHA
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost ?? request.headers.get("host") ?? ""

  return Boolean(
    Date.now() <= DEADLINE &&
      suppliedSha &&
      deployedSha &&
      suppliedSha === deployedSha &&
      (host === "app.oremea.com" || host.startsWith("app.oremea.com:")),
  )
}

async function readMigrationRows() {
  return prisma.$queryRaw<MigrationRow[]>`
    SELECT
      "started_at",
      "finished_at",
      "rolled_back_at",
      "logs"
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20260810132000_add_recognition_conversation'
    ORDER BY "started_at" DESC
  `
}

async function schemaIsComplete() {
  const rows = await prisma.$queryRaw<
    Array<{
      threads: string | null
      messages: string | null
      user_index: string | null
      turn_index: string | null
      client_message_index: string | null
      foreign_key: string | null
    }>
  >`
    SELECT
      to_regclass('public.recognition_threads')::text AS "threads",
      to_regclass('public.recognition_messages')::text AS "messages",
      to_regclass('public.recognition_threads_user_id_key')::text AS "user_index",
      to_regclass('public.recognition_messages_thread_id_turn_index_key')::text AS "turn_index",
      to_regclass('public.recognition_messages_thread_id_client_message_id_key')::text AS "client_message_index",
      (
        SELECT conname
        FROM pg_constraint
        WHERE conname = 'recognition_messages_thread_id_fkey'
        LIMIT 1
      )::text AS "foreign_key"
  `

  const row = rows[0]
  return Boolean(
    row?.threads &&
      row?.messages &&
      row?.user_index &&
      row?.turn_index &&
      row?.client_message_index &&
      row?.foreign_key,
  )
}

async function runPrisma(args: string[]) {
  const executable = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.cmd" : "prisma",
  )

  await execFileAsync(executable, args, {
    cwd: process.cwd(),
    env: process.env,
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  })
}

export async function POST(request: Request) {
  if (!isAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  let stage = "precondition"

  try {
    const [schemaComplete, before] = await Promise.all([
      schemaIsComplete(),
      readMigrationRows(),
    ])

    const unresolved = before.filter(
      (row) => !row.finished_at && !row.rolled_back_at,
    )
    const alreadyApplied = before.some((row) => Boolean(row.finished_at))
    const failedBecauseSchemaExists = unresolved.some((row) =>
      /already exists|42P07/i.test(row.logs ?? ""),
    )

    if (!schemaComplete || alreadyApplied || unresolved.length !== 1 || !failedBecauseSchemaExists) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          error: "Recognition migration state did not match the verified repair precondition.",
          schemaComplete,
          unresolvedCount: unresolved.length,
          alreadyApplied,
          failedBecauseSchemaExists,
        },
        { status: 409 },
      )
    }

    stage = "resolve"
    await runPrisma([
      "migrate",
      "resolve",
      "--applied",
      MIGRATION,
      `--schema=${PRISMA_SCHEMA}`,
    ])

    stage = "verify-history"
    const after = await readMigrationRows()
    const unresolvedAfter = after.filter(
      (row) => !row.finished_at && !row.rolled_back_at,
    )
    const appliedAfter = after.some((row) => Boolean(row.finished_at))

    if (!appliedAfter || unresolvedAfter.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          error: "Prisma did not leave the Recognition migration history resolved.",
          applied: appliedAfter,
          unresolvedCount: unresolvedAfter.length,
        },
        { status: 500 },
      )
    }

    stage = "status"
    await runPrisma([
      "migrate",
      "status",
      `--schema=${PRISMA_SCHEMA}`,
    ])

    return NextResponse.json({
      ok: true,
      stage: "complete",
      migration: MIGRATION,
      schemaComplete: true,
      applied: true,
      unresolvedCount: 0,
    })
  } catch (error) {
    console.error(`Recognition migration repair failed at ${stage}:`, error)
    return NextResponse.json(
      {
        ok: false,
        stage,
        error: "Recognition migration could not be resolved.",
      },
      { status: 500 },
    )
  }
}
