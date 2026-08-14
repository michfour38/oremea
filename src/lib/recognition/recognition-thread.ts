import { prisma } from "@/lib/prisma";

function threadLockKey(userId: string) {
  return `recognition-thread-lifecycle:${userId}`;
}

export async function getOrCreateActiveRecognitionThread({
  userId,
  primaryEmail,
}: {
  userId: string;
  primaryEmail: string | null;
}) {
  return prisma.$transaction(async (transaction) => {
    const lockKey = threadLockKey(userId);
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const active = await transaction.recognition_threads.findFirst({
      where: {
        user_id: userId,
        status: "active",
      },
      orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
      select: {
        id: true,
        primary_email: true,
        status: true,
        memory_snapshot: true,
        message_count: true,
        last_message_at: true,
        created_at: true,
      },
    });

    if (active) {
      if (primaryEmail && active.primary_email !== primaryEmail) {
        return transaction.recognition_threads.update({
          where: { id: active.id },
          data: { primary_email: primaryEmail },
          select: {
            id: true,
            primary_email: true,
            status: true,
            memory_snapshot: true,
            message_count: true,
            last_message_at: true,
            created_at: true,
          },
        });
      }
      return active;
    }

    return transaction.recognition_threads.create({
      data: {
        user_id: userId,
        primary_email: primaryEmail,
        status: "active",
      },
      select: {
        id: true,
        primary_email: true,
        status: true,
        memory_snapshot: true,
        message_count: true,
        last_message_at: true,
        created_at: true,
      },
    });
  });
}

export async function getActiveRecognitionThread(userId: string) {
  return prisma.recognition_threads.findFirst({
    where: {
      user_id: userId,
      status: "active",
    },
    orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
  });
}

export async function startNewRecognitionThread({
  userId,
  primaryEmail,
}: {
  userId: string;
  primaryEmail: string | null;
}) {
  return prisma.$transaction(async (transaction) => {
    const lockKey = threadLockKey(userId);
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const now = new Date();
    await transaction.recognition_threads.updateMany({
      where: {
        user_id: userId,
        status: "active",
      },
      data: {
        status: "archived",
        archived_at: now,
      },
    });

    return transaction.recognition_threads.create({
      data: {
        user_id: userId,
        primary_email: primaryEmail,
        status: "active",
      },
      select: {
        id: true,
        created_at: true,
      },
    });
  });
}
