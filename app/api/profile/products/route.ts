import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRunActiveDay } from "@/src/lib/resonance/resonance-run-data";

export const dynamic = "force-dynamic";

const RESONANCE_COURSE_COUNT = 10;

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || "";

    const [resonanceEntitlement, resonanceRuns, recognitionLead, compassSession] =
      await Promise.all([
        prisma.oremea_entitlements.findFirst({
          where: {
            user_id: userId,
            product_key: {
              startsWith: "resonance",
            },
            status: "active",
            revoked_at: null,
            OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
          },
          orderBy: {
            granted_at: "desc",
          },
          select: {
            product_key: true,
            status: true,
            granted_at: true,
            expires_at: true,
          },
        }),

        prisma.resonance_week_runs.findMany({
          where: { user_id: userId },
          orderBy: [{ started_at: "desc" }, { run_number: "desc" }],
          select: {
            id: true,
            week_number: true,
            run_number: true,
            status: true,
            started_at: true,
            completed_at: true,
          },
        }),

        email
          ? prisma.entry_leads.findUnique({
              where: { email },
              select: {
                entry_paid_at: true,
                intro_completed_at: true,
                entry_mirror_sessions: {
                  orderBy: { started_at: "desc" },
                  take: 1,
                  select: {
                    status: true,
                    started_at: true,
                    completed_at: true,
                  },
                },
              },
            })
          : null,

        prisma.compass_sessions.findFirst({
          where: { user_id: userId },
          orderBy: { updated_at: "desc" },
          select: {
            status: true,
            phase: true,
            updated_at: true,
          },
        }),
      ]);

    const completedRuns = resonanceRuns.filter(
      (run) => run.status === "completed" || Boolean(run.completed_at),
    );
    const completedCourseNumbers = Array.from(
      new Set(completedRuns.map((run) => run.week_number)),
    ).sort((a, b) => a - b);
    const activeRun = resonanceRuns.find((run) => run.status === "active") || null;
    const courseNumbers = Array.from(
      new Set(resonanceRuns.map((run) => run.week_number)),
    );
    const courseTitles = courseNumbers.length
      ? await prisma.resonance_weeks.findMany({
          where: { week_number: { in: courseNumbers } },
          select: { week_number: true, title: true },
        })
      : [];
    const courseTitleByNumber = new Map(
      courseTitles.map((course) => [course.week_number, course.title]),
    );
    const completedCourseRecords = completedCourseNumbers
      .map((weekNumber) =>
        completedRuns.find((run) => run.week_number === weekNumber),
      )
      .filter((run): run is (typeof completedRuns)[number] => Boolean(run));

    let activeDay: number | null = null;

    if (activeRun) {
      try {
        activeDay = await getRunActiveDay(activeRun.id, activeRun.week_number);
      } catch (error) {
        console.error("Profile could not resolve the active Resonance day:", error);
      }
    }

    const latestRecognitionSession =
      recognitionLead?.entry_mirror_sessions[0] || null;
    const recognitionCompleted = Boolean(
      latestRecognitionSession?.completed_at ||
        latestRecognitionSession?.status === "completed" ||
        recognitionLead?.intro_completed_at,
    );
    const hasResonanceRecord = Boolean(
      resonanceEntitlement || resonanceRuns.length > 0,
    );

    return NextResponse.json({
      success: true,
      products: {
        recognition: recognitionLead
          ? {
              active: !recognitionCompleted,
              status: recognitionCompleted ? "completed" : "in_progress",
              startedAt:
                latestRecognitionSession?.started_at?.toISOString() || null,
              completedAt:
                latestRecognitionSession?.completed_at?.toISOString() ||
                recognitionLead.intro_completed_at?.toISOString() ||
                null,
            }
          : null,

        resonance: hasResonanceRecord
          ? {
              active: Boolean(activeRun),
              status: activeRun
                ? "in_progress"
                : completedCourseNumbers.length > 0
                  ? "completed"
                  : "ready",
              completedCount: completedCourseNumbers.length,
              completedRunCount: completedRuns.length,
              completedCourseNumbers,
              totalCourses: RESONANCE_COURSE_COUNT,
              activeRun: activeRun
                ? {
                    weekNumber: activeRun.week_number,
                    courseTitle:
                      courseTitleByNumber.get(activeRun.week_number) ||
                      `Course ${activeRun.week_number}`,
                    dayNumber: activeDay,
                    startedAt: activeRun.started_at.toISOString(),
                  }
                : null,
              completedCourses: completedCourseRecords
                .slice(0, 5)
                .map((run) => ({
                  weekNumber: run.week_number,
                  runNumber: run.run_number,
                  courseTitle:
                    courseTitleByNumber.get(run.week_number) ||
                    `Course ${run.week_number}`,
                  completedAt: run.completed_at?.toISOString() || null,
                })),
              entitlement: resonanceEntitlement
                ? {
                    productKey: resonanceEntitlement.product_key,
                    grantedAt: resonanceEntitlement.granted_at.toISOString(),
                    expiresAt:
                      resonanceEntitlement.expires_at?.toISOString() || null,
                  }
                : null,
            }
          : null,

        compass: compassSession
          ? {
              active: compassSession.status !== "completed",
              status: compassSession.status,
              phase: compassSession.phase,
              updatedAt: compassSession.updated_at.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/profile/products failed:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load profile products" },
      { status: 500 },
    );
  }
}
