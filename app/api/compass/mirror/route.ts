import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { runCompassMirror } from "@/src/lib/compass/session/compass-mirror.service"

type MirrorStage = "area" | "core"

type CompassMirrorCache = {
  mirrorCacheVersion: 1
  areaMirror: string | null
  coreMirror: string | null
  ending: unknown | null
}

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ ok: false, output: null }, { status: 401 })
    }

    const stage = readStage(new URL(request.url).searchParams.get("stage"))
    const session = await prisma.compass_sessions.findFirst({
      where: {
        user_id: userId,
        status: "active",
      },
      orderBy: {
        updated_at: "desc",
      },
      select: {
        detected_patterns: true,
      },
    })

    if (!session) {
      return NextResponse.json({ ok: true, output: null })
    }

    const cache = readMirrorCache(session.detected_patterns)
    const output = stage === "area" ? cache.areaMirror : cache.coreMirror

    return NextResponse.json({ ok: true, output })
  } catch (error) {
    console.error("GET /api/compass/mirror failed:", error)
    return NextResponse.json({ ok: false, output: null }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const mirrorStage = readStage(body.mirrorStage)

    const output = await runCompassMirror({
      areaResponses: body.areaResponses ?? [],
      selectedArea: body.selectedArea ?? null,
      recursiveLayers: body.recursiveLayers ?? [],
      mirrorStage,
    })

    if (!output) {
      return NextResponse.json(
        {
          ok: false,
          error: "Compass Mirror returned no output.",
        },
        { status: 500 },
      )
    }

    const session = await prisma.compass_sessions.findFirst({
      where: {
        user_id: userId,
        status: "active",
      },
      orderBy: {
        updated_at: "desc",
      },
      select: {
        id: true,
        detected_patterns: true,
      },
    })

    if (session) {
      const cache = readMirrorCache(session.detected_patterns)
      const nextCache: CompassMirrorCache = {
        ...cache,
        areaMirror: mirrorStage === "area" ? output : cache.areaMirror,
        coreMirror: mirrorStage === "core" ? output : cache.coreMirror,
      }

      await prisma.compass_sessions.update({
        where: { id: session.id },
        data: {
          detected_patterns: nextCache as object,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      output,
    })
  } catch (error) {
    console.error("POST /api/compass/mirror failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Compass Mirror error.",
      },
      { status: 500 },
    )
  }
}

function readStage(value: unknown): MirrorStage {
  return value === "area" ? "area" : "core"
}

function readMirrorCache(value: unknown): CompassMirrorCache {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>

    if (row.mirrorCacheVersion === 1) {
      return {
        mirrorCacheVersion: 1,
        areaMirror: typeof row.areaMirror === "string" ? row.areaMirror : null,
        coreMirror: typeof row.coreMirror === "string" ? row.coreMirror : null,
        ending: row.ending ?? null,
      }
    }
  }

  return {
    mirrorCacheVersion: 1,
    areaMirror: null,
    coreMirror: null,
    ending: value ?? null,
  }
}
