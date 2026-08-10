import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DEADLINE = Date.parse("2026-08-10T16:30:00Z")
const MIGRATION = "20260810132000_add_recognition_conversation"

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

export async function GET(request: Request) {
  if (!isAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  try {
    const migrations = await prisma.$queryRaw<
      Array<{
        migration_name: string
        started_at: Date
        finished_at: Date | null
        rolled_back_at: Date | null
        logs: string | null
      }>
    >`
      SELECT
        "migration_name",
        "started_at",
        "finished_at",
        "rolled_back_at",
        "logs"
      FROM "_prisma_migrations"
      WHERE "migration_name" = '20260810132000_add_recognition_conversation'
      ORDER BY "started_at" DESC
    `

    const objects = await prisma.$queryRaw<
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

    const migrationStates = migrations.map((row) => {
      const logs = row.logs ?? ""
      return {
        startedAt: row.started_at,
        finished: Boolean(row.finished_at),
        rolledBack: Boolean(row.rolled_back_at),
        mentionsAlreadyExists: /already exists|42P07/i.test(logs),
        mentionsFailedMigration: /P3009|failed migration/i.test(logs),
      }
    })

    const schema = objects[0]
    const schemaComplete = Boolean(
      schema?.threads &&
        schema?.messages &&
        schema?.user_index &&
        schema?.turn_index &&
        schema?.client_message_index &&
        schema?.foreign_key,
    )

    return NextResponse.json({
      ok: true,
      migration: MIGRATION,
      service: process.env.RAILWAY_SERVICE_NAME ?? null,
      schemaComplete,
      migrationRows: migrationStates,
    })
  } catch (error) {
    console.error("Recognition migration status check failed:", error)
    return NextResponse.json(
      { ok: false, error: "Migration status check failed." },
      { status: 500 },
    )
  }
}
