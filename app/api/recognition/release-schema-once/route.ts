import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RELEASE_DEADLINE = Date.parse("2026-08-12T21:59:00Z");
let releaseComplete = false;

function requestIsAuthorized(request: Request) {
  const suppliedSha = request.headers.get("x-oremea-release-sha");
  const deployedSha = process.env.RAILWAY_GIT_COMMIT_SHA;

  return Boolean(
    !releaseComplete &&
      Date.now() <= RELEASE_DEADLINE &&
      suppliedSha &&
      deployedSha &&
      suppliedSha === deployedSha,
  );
}

async function applySchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "recognition_threads" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "user_id" TEXT NOT NULL,
      "primary_email" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "memory_snapshot" JSONB NOT NULL DEFAULT '{}',
      "message_count" INTEGER NOT NULL DEFAULT 0,
      "last_message_at" TIMESTAMPTZ(6),
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "recognition_threads_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "recognition_messages" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "thread_id" UUID NOT NULL,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "turn_index" INTEGER NOT NULL,
      "client_message_id" TEXT,
      "evidence_snapshot" JSONB NOT NULL DEFAULT '{}',
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "recognition_messages_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "recognition_messages"
    ADD COLUMN IF NOT EXISTS "client_message_id" TEXT
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "recognition_threads_user_id_key"
      ON "recognition_threads"("user_id")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "recognition_threads_status_idx"
      ON "recognition_threads"("status")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "recognition_threads_last_message_at_idx"
      ON "recognition_threads"("last_message_at")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "recognition_messages_thread_id_turn_index_key"
      ON "recognition_messages"("thread_id", "turn_index")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "recognition_messages_thread_id_client_message_id_key"
      ON "recognition_messages"("thread_id", "client_message_id")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "recognition_messages_thread_id_created_at_idx"
      ON "recognition_messages"("thread_id", "created_at")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "recognition_messages_role_idx"
      ON "recognition_messages"("role")
  `);

  const foreignKeyRows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'recognition_messages_thread_id_fkey'
    ) AS "exists"
  `;

  if (!foreignKeyRows[0]?.exists) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "recognition_messages"
      ADD CONSTRAINT "recognition_messages_thread_id_fkey"
      FOREIGN KEY ("thread_id") REFERENCES "recognition_threads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
}

async function verifySchema() {
  const rows = await prisma.$queryRaw<
    Array<{
      threads: string | null;
      messages: string | null;
      userIndex: string | null;
      turnIndex: string | null;
      clientMessageIndex: string | null;
      foreignKey: string | null;
    }>
  >`
    SELECT
      to_regclass('public.recognition_threads')::text AS "threads",
      to_regclass('public.recognition_messages')::text AS "messages",
      to_regclass('public.recognition_threads_user_id_key')::text AS "userIndex",
      to_regclass('public.recognition_messages_thread_id_turn_index_key')::text AS "turnIndex",
      to_regclass('public.recognition_messages_thread_id_client_message_id_key')::text AS "clientMessageIndex",
      (
        SELECT conname
        FROM pg_constraint
        WHERE conname = 'recognition_messages_thread_id_fkey'
        LIMIT 1
      )::text AS "foreignKey"
  `;

  const result = rows[0];
  return {
    ok: Boolean(
      result?.threads &&
        result?.messages &&
        result?.userIndex &&
        result?.turnIndex &&
        result?.clientMessageIndex &&
        result?.foreignKey,
    ),
    result,
  };
}

export async function POST(request: Request) {
  if (!requestIsAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const url = new URL(request.url);
  const phase = url.searchParams.get("phase");

  try {
    if (phase === "ready") {
      return NextResponse.json({ ok: true, phase: "ready" });
    }

    if (phase === "apply") {
      await applySchema();
      return NextResponse.json({ ok: true, phase: "apply" });
    }

    if (phase === "verify") {
      const verification = await verifySchema();
      return NextResponse.json(
        { ok: verification.ok, phase: "verify", ...verification.result },
        { status: verification.ok ? 200 : 500 },
      );
    }

    if (phase === "close") {
      releaseComplete = true;
      return NextResponse.json({ ok: true, phase: "closed" });
    }

    return NextResponse.json(
      { ok: false, error: "Unknown release phase" },
      { status: 400 },
    );
  } catch (error) {
    console.error(`Recognition schema release phase ${phase} failed:`, error);

    return NextResponse.json(
      {
        ok: false,
        phase,
        error: error instanceof Error ? error.message : "Unknown release error",
      },
      { status: 500 },
    );
  }
}
