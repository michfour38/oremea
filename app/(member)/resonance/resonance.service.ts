import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromptType = "thread_prompt" | "mirror_exercise";

export interface DayPromptDTO {
  id: string;
  type: PromptType;
  promptOrder: number;
  label: string | null;
  content: string;
  isCompleted: boolean;
  isShared: boolean;
  isUnlocked: boolean;
  completionId: string | null;
  response: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  canEdit: boolean;
}

export interface PromptWithGatingDTO {
  id: string;
  type: PromptType;
  promptOrder: number;
  label: string | null;
  content: string;
  isUnlocked: boolean;
  userCompletion: {
    id: string;
    response: string;
    isShared: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface DayContentDTO {
  weekId: string;
  weekNumber: number;
  weekTitle: string;
  weekTheme: string;
  dayId: string;
  dayNumber: number;
  prompts: DayPromptDTO[];
}

export interface ReactionSummary {
  witnessCount: number;
  resonatedCount: number;
  myWitness: boolean;
  myResonated: boolean;
}

export interface AnalysisDTO {
  id: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  isOwn: boolean;
}

export type AnalysisStatus = "private" | "requested_public" | "public";

export interface PromptResponseDTO {
  completionId: string;
  userId: string;
  displayName: string;
  response: string;
  createdAt: string;
  reactions: ReactionSummary;
  analysisSummary: {
    count: number;
    publicAnalyses: AnalysisDTO[];
    privateAnalyses: AnalysisDTO[];
    pendingApproval: AnalysisDTO[];
    myAnalysis: AnalysisDTO | null;
    isReflectionAuthor: boolean;
  };
}

export interface PromptThreadDTO {
  promptId: string;
  myResponse: PromptResponseDTO;
  groupResponses: PromptResponseDTO[];
}

export interface DiscoverReadinessSignalDTO {
  eligible: boolean;
  score: number;
  reasons: string[];
  reflectionsCount: number;
}

const EDIT_WINDOW_MS = 10 * 60 * 1000;

const SEEN_PATTERNS = [
  "be seen",
  "seen",
  "witnessed",
  "witness",
  "understood",
  "understand me",
  "someone could see",
  "someone to see",
  "want to be seen",
  "want to be understood",
  "wish someone could see",
  "wish someone understood",
  "i want to share",
  "share this",
  "say this out loud",
  "tell someone",
  "open up",
  "be known",
  "known by",
];

const CONNECTION_PATTERNS = [
  "not do this alone",
  "do this alone",
  "alone",
  "lonely",
  "loneliness",
  "connection",
  "connected",
  "belong",
  "belonging",
  "with others",
  "with people",
  "want connection",
  "need connection",
  "need people",
  "want people",
  "want community",
  "need community",
  "feel less alone",
  "group",
  "journey with others",
  "shared",
];

const RELATIONAL_CURIOSITY_PATTERNS = [
  "others feel this too",
  "does anyone else",
  "wonder if others",
  "curious if others",
  "shared experience",
  "hear from others",
  "how others",
  "relate to this",
  "resonate with this",
  "what others think",
  "how this lands",
];

const AMBIVALENCE_PATTERNS = [
  "keep this to myself",
  "kept this to myself",
  "part of me wants to share",
  "part of me wants to be seen",
  "scared to be seen",
  "afraid to be seen",
  "hard to share",
  "hesitant to share",
  "nervous to share",
  "usually keep this hidden",
  "usually hide this",
  "don't want to hide",
  "dont want to hide",
  "i hold back",
  "i pull back",
  "i want to but",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function countUniqueMatches(text: string, patterns: string[]): number {
  return patterns.filter((pattern) => text.includes(pattern)).length;
}

function isWithinEditWindow(createdAt: Date | null | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;
}

function buildReactionSummary(
  reactions: { user_id: string; type: string }[],
  userId: string
): ReactionSummary {
  return {
    witnessCount: reactions.filter((r) => r.type === "witness").length,
    resonatedCount: reactions.filter((r) => r.type === "resonated").length,
    myWitness: reactions.some(
      (r) => r.user_id === userId && r.type === "witness"
    ),
    myResonated: reactions.some(
      (r) => r.user_id === userId && r.type === "resonated"
    ),
  };
}

type RawAnalysis = {
  id: string;
  author_id: string;
  content: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  profiles: { display_name: string };
};

function buildAnalysisSummary(
  analyses: RawAnalysis[],
  reflectionAuthorId: string,
  currentUserId: string
): PromptResponseDTO["analysisSummary"] {
  const isReflectionAuthor = currentUserId === reflectionAuthorId;

  const toDTO = (a: RawAnalysis): AnalysisDTO => ({
    id: a.id,
    authorId: a.author_id,
    authorDisplayName: a.profiles.display_name,
    content: a.content,
    status: a.status as AnalysisStatus,
    createdAt: a.created_at.toISOString(),
    updatedAt: a.updated_at.toISOString(),
    isOwn: a.author_id === currentUserId,
  });

  const publicAnalyses = analyses
    .filter((a) => a.status === "public")
    .map(toDTO);

  const privateAnalyses = analyses
    .filter(
      (a) =>
        a.status === "private" &&
        (isReflectionAuthor || a.author_id === currentUserId)
    )
    .map(toDTO);

  const pendingApproval = analyses
    .filter(
      (a) =>
        a.status === "requested_public" &&
        (isReflectionAuthor || a.author_id === currentUserId)
    )
    .map(toDTO);

  const allVisible = [
    ...publicAnalyses,
    ...privateAnalyses,
    ...pendingApproval,
  ];
  const myAnalysis = allVisible.find((a) => a.isOwn) ?? null;

  return {
    count: analyses.length,
    publicAnalyses,
    privateAnalyses,
    pendingApproval,
    myAnalysis,
    isReflectionAuthor,
  };
}

function applyGating(
  prompts: Omit<DayPromptDTO, "isUnlocked">[],
  completedIds: Set<string>
): DayPromptDTO[] {
  let lastThreadCompleted = true;

  return prompts.map((prompt) => {
    if (prompt.type === "mirror_exercise") {
      return { ...prompt, isUnlocked: true };
    }

    const isUnlocked = lastThreadCompleted;
    lastThreadCompleted = completedIds.has(prompt.id);

    return { ...prompt, isUnlocked };
  });
}

// ─── Discover readiness signal ────────────────────────────────────────────────

export async function getDiscoverReadinessSignal(
  userId: string
): Promise<DiscoverReadinessSignalDTO> {
  const completions = await prisma.prompt_completions.findMany({
    where: {
      user_id: userId,
      day_prompts: {
        type: "thread_prompt",
      },
    },
    orderBy: { created_at: "asc" },
    select: {
      response: true,
      is_shared: true,
    },
  });

  const privateThreadResponses = completions.filter(
    (c) => c.response.trim().length > 0 && !c.is_shared
  );

  let totalScore = 0;
  let seenCount = 0;
  let connectionCount = 0;
  let curiosityCount = 0;
  let ambivalenceCount = 0;

  for (const completion of privateThreadResponses) {
    const text = normalizeText(completion.response);
    if (text.length < 40) continue;

    const seenMatches = countUniqueMatches(text, SEEN_PATTERNS);
    const connectionMatches = countUniqueMatches(text, CONNECTION_PATTERNS);
    const curiosityMatches = countUniqueMatches(
      text,
      RELATIONAL_CURIOSITY_PATTERNS
    );
    const ambivalenceMatches = countUniqueMatches(text, AMBIVALENCE_PATTERNS);

    const score =
      seenMatches * 3 +
      connectionMatches * 3 +
      curiosityMatches * 2 +
      ambivalenceMatches * 2;

    totalScore += score;
    if (seenMatches > 0) seenCount += 1;
    if (connectionMatches > 0) connectionCount += 1;
    if (curiosityMatches > 0) curiosityCount += 1;
    if (ambivalenceMatches > 0) ambivalenceCount += 1;
  }

  const reasons: string[] = [];
  if (seenCount > 0) reasons.push("desire_to_be_seen");
  if (connectionCount > 0) reasons.push("desire_for_connection");
  if (curiosityCount > 0) reasons.push("curiosity_about_others");
  if (ambivalenceCount > 0) reasons.push("privacy_connection_tension");

  const eligible =
    privateThreadResponses.length >= 2 &&
    totalScore >= 9 &&
    (seenCount >= 1 || connectionCount >= 1) &&
    (connectionCount >= 1 || curiosityCount >= 1 || ambivalenceCount >= 1);

  return {
    eligible,
    score: totalScore,
    reasons,
    reflectionsCount: privateThreadResponses.length,
  };
}

export async function getPromptWithGating(
  promptId: string,
  userId: string
): Promise<PromptWithGatingDTO | null> {
  const prompt = await prisma.day_prompts.findUnique({
    where: { id: promptId },
    select: {
      id: true,
      type: true,
      prompt_order: true,
      label: true,
      content: true,
      day_id: true,
      prompt_completions: {
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          response: true,
          is_shared: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
  });

  if (!prompt) return null;

  let isUnlocked = true;

  if (prompt.type === "thread_prompt") {
    const previous = await prisma.day_prompts.findFirst({
      where: {
        day_id: prompt.day_id,
        type: "thread_prompt",
        prompt_order: { lt: prompt.prompt_order },
      },
      orderBy: { prompt_order: "desc" },
      select: {
        id: true,
        prompt_completions: {
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          select: { id: true },
        },
      },
    });

    if (previous !== null) {
      isUnlocked = previous.prompt_completions.length > 0;
    }
  }

  const completion = prompt.prompt_completions[0] ?? null;

  return {
    id: prompt.id,
    type: prompt.type as PromptType,
    promptOrder: prompt.prompt_order,
    label: prompt.label,
    content: prompt.content,
    isUnlocked,
    userCompletion: completion
      ? {
          id: completion.id,
          response: completion.response,
          isShared: completion.is_shared,
          createdAt: completion.created_at.toISOString(),
          updatedAt: completion.updated_at.toISOString(),
        }
      : null,
  };
}

export async function getPromptThread(
  promptId: string,
  userId: string
): Promise<PromptThreadDTO | null> {
  const prompt = await prisma.day_prompts.findUnique({
    where: { id: promptId },
    select: {
      id: true,
      type: true,
    },
  });

  if (!prompt || prompt.type === "mirror_exercise") return null;

  const completions = await prisma.prompt_completions.findMany({
    where: {
      prompt_id: promptId,
      is_shared: true,
    },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      user_id: true,
      response: true,
      created_at: true,
      profiles: { select: { id: true, display_name: true } },
      prompt_reactions: { select: { user_id: true, type: true } },
      prompt_analyses: {
        select: {
          id: true,
          author_id: true,
          content: true,
          status: true,
          created_at: true,
          updated_at: true,
          profiles: { select: { display_name: true } },
        },
      },
    },
  });

  const mine = completions.find((c) => c.user_id === userId);
  if (!mine) return null;

  const myResponse: PromptResponseDTO = {
    completionId: mine.id,
    userId: mine.user_id,
    displayName: mine.profiles.display_name,
    response: mine.response,
    createdAt: mine.created_at.toISOString(),
    reactions: buildReactionSummary(mine.prompt_reactions, userId),
    analysisSummary: buildAnalysisSummary(
      mine.prompt_analyses,
      mine.user_id,
      userId
    ),
  };

  const groupResponses: PromptResponseDTO[] = completions
    .filter((c) => c.user_id !== userId)
    .map((c) => ({
      completionId: c.id,
      userId: c.user_id,
      displayName: c.profiles.display_name,
      response: c.response,
      createdAt: c.created_at.toISOString(),
      reactions: buildReactionSummary(c.prompt_reactions, userId),
      analysisSummary: buildAnalysisSummary(
        c.prompt_analyses,
        c.user_id,
        userId
      ),
    }));

  return { promptId, myResponse, groupResponses };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CompletePromptResult {
  id: string;
  isShared: boolean;
}

export async function completePrompt(
  promptId: string,
  userId: string,
  response: string,
  isShared: boolean = false
): Promise<CompletePromptResult> {
  const existingProfile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingProfile) {
    await prisma.profiles.create({
      data: {
        id: userId,
        display_name: "New User",
        pathway: "discover",
        updated_at: new Date(),
      },
    });
  }

  const existing = await prisma.prompt_completions.findUnique({
    where: { prompt_id_user_id: { prompt_id: promptId, user_id: userId } },
    select: { id: true, created_at: true },
  });

  if (existing) {
    if (!isWithinEditWindow(existing.created_at)) {
      throw new Error("The 10-minute edit window has closed.");
    }

    const updated = await prisma.prompt_completions.update({
      where: { id: existing.id },
      data: { response, is_shared: isShared },
      select: { id: true, is_shared: true },
    });
    return { id: updated.id, isShared: updated.is_shared };
  }

  const created = await prisma.prompt_completions.create({
    data: {
      prompt_id: promptId,
      user_id: userId,
      response,
      is_shared: isShared,
    },
    select: { id: true, is_shared: true },
  });

  return { id: created.id, isShared: created.is_shared };
}

export async function toggleWitness(
  completionId: string,
  userId: string
): Promise<{ active: boolean }> {
  const existing = await prisma.prompt_reactions.findUnique({
    where: {
      completion_id_user_id_type: {
        completion_id: completionId,
        user_id: userId,
        type: "witness",
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.prompt_reactions.delete({ where: { id: existing.id } });
    return { active: false };
  }

  await prisma.prompt_reactions.create({
    data: { completion_id: completionId, user_id: userId, type: "witness" },
  });

  return { active: true };
}

export async function toggleResonated(
  completionId: string,
  userId: string
): Promise<{ active: boolean }> {
  const existing = await prisma.prompt_reactions.findUnique({
    where: {
      completion_id_user_id_type: {
        completion_id: completionId,
        user_id: userId,
        type: "resonated",
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.prompt_reactions.delete({ where: { id: existing.id } });
    return { active: false };
  }

  await prisma.prompt_reactions.create({
    data: { completion_id: completionId, user_id: userId, type: "resonated" },
  });

  return { active: true };
}

export async function upsertAnalysis(
  completionId: string,
  authorId: string,
  content: string
): Promise<{ id: string }> {
  const completion = await prisma.prompt_completions.findUnique({
    where: { id: completionId },
    select: { user_id: true },
  });

  if (!completion) throw new Error("Completion not found");
  if (completion.user_id === authorId) {
    throw new Error("Cannot analyze your own reflection");
  }

  const existing = await prisma.prompt_analyses.findUnique({
    where: {
      completion_id_author_id: {
        completion_id: completionId,
        author_id: authorId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    const updated = await prisma.prompt_analyses.update({
      where: { id: existing.id },
      data: { content },
      select: { id: true },
    });
    return { id: updated.id };
  }

  const created = await prisma.prompt_analyses.create({
    data: { completion_id: completionId, author_id: authorId, content },
    select: { id: true },
  });

  return { id: created.id };
}

export async function requestAnalysisPublic(
  analysisId: string,
  userId: string
): Promise<void> {
  const analysis = await prisma.prompt_analyses.findUnique({
    where: { id: analysisId },
    select: { author_id: true, status: true },
  });

  if (!analysis) throw new Error("Analysis not found");
  if (analysis.author_id !== userId) throw new Error("Not your analysis");
  if (analysis.status !== "private") return;

  await prisma.prompt_analyses.update({
    where: { id: analysisId },
    data: { status: "requested_public" },
  });
}

export async function withdrawAnalysisPublicRequest(
  analysisId: string,
  userId: string
): Promise<void> {
  const analysis = await prisma.prompt_analyses.findUnique({
    where: { id: analysisId },
    select: { author_id: true, status: true },
  });

  if (!analysis) throw new Error("Analysis not found");
  if (analysis.author_id !== userId) throw new Error("Not your analysis");
  if (analysis.status !== "requested_public") return;

  await prisma.prompt_analyses.update({
    where: { id: analysisId },
    data: { status: "private" },
  });
}

export async function approveAnalysisPublic(
  analysisId: string,
  userId: string
): Promise<void> {
  const analysis = await prisma.prompt_analyses.findUnique({
    where: { id: analysisId },
    select: {
      status: true,
      prompt_completions: { select: { user_id: true } },
    },
  });

  if (!analysis) throw new Error("Analysis not found");
  if (analysis.prompt_completions.user_id !== userId) {
    throw new Error("Only the reflection author can approve");
  }
  if (analysis.status !== "requested_public") return;

  await prisma.prompt_analyses.update({
    where: { id: analysisId },
    data: { status: "public" },
  });
}

export async function declineAnalysisPublic(
  analysisId: string,
  userId: string
): Promise<void> {
  const analysis = await prisma.prompt_analyses.findUnique({
    where: { id: analysisId },
    select: {
      status: true,
      prompt_completions: { select: { user_id: true } },
    },
  });

  if (!analysis) throw new Error("Analysis not found");
  if (analysis.prompt_completions.user_id !== userId) {
    throw new Error("Only the reflection author can decline");
  }
  if (analysis.status !== "requested_public") return;

  await prisma.prompt_analyses.update({
    where: { id: analysisId },
    data: { status: "private" },
  });
}

export async function makeAnalysisPrivateAgain(
  analysisId: string,
  userId: string
): Promise<void> {
  const analysis = await prisma.prompt_analyses.findUnique({
    where: { id: analysisId },
    select: {
      status: true,
      prompt_completions: { select: { user_id: true } },
    },
  });

  if (!analysis) throw new Error("Analysis not found");
  if (analysis.prompt_completions.user_id !== userId) {
    throw new Error("Only the reflection author can revoke public visibility");
  }
  if (analysis.status !== "public") return;

  await prisma.prompt_analyses.update({
    where: { id: analysisId },
    data: { status: "private" },
  });
}

export async function getReflectionArchive(userId: string) {
  const reflections = await prisma.prompt_completions.findMany({
    where: {
      user_id: userId,
      response: {
        not: "",
      },
    },
    select: {
      id: true,
      response: true,
      created_at: true,
      day_prompts: {
        select: {
          content: true,
          journey_days: {
            select: {
              day_number: true,
              journey_weeks: {
                select: {
                  week_number: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 100,
  });

  const roomNames: Record<number, string> = {
    1: "The Hearth",
    2: "The Mirror",
    3: "The Garden",
    4: "The Compass",
    5: "The Pulse",
    6: "The Shadow",
    7: "The Forge",
    8: "The Vision",
  };

  return reflections.map((r) => {
    const weekNumber =
      r.day_prompts?.journey_days?.journey_weeks?.week_number ?? null;
    const dayNumber = r.day_prompts?.journey_days?.day_number ?? null;

    return {
      id: r.id,
      response: r.response,
      question: r.day_prompts?.content ?? "",
      createdAt: r.created_at,
      weekNumber,
      dayNumber,
      roomName: weekNumber ? roomNames[weekNumber] ?? null : null,
    };
  });
}