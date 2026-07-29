// Legacy Resonance compatibility surface.
//
// Resonance is now a private, solo, run-scoped journey. This module remains only
// so any unreached historical component imports continue to compile while the
// old Discover/Relate social behavior stays unavailable.

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

export interface ReactionSummary {
  witnessCount: number;
  resonatedCount: number;
  myWitness: boolean;
  myResonated: boolean;
}

export type AnalysisStatus = "private" | "requested_public" | "public";

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

export interface CompletePromptResult {
  id: string;
  isShared: boolean;
}

const RETIRED_MESSAGE =
  "This legacy Resonance social action has been retired. Resonance is private and run-scoped.";

function retired(): never {
  throw new Error(RETIRED_MESSAGE);
}

export async function getDiscoverReadinessSignal(
  _userId: string,
): Promise<DiscoverReadinessSignalDTO> {
  return {
    eligible: false,
    score: 0,
    reasons: [],
    reflectionsCount: 0,
  };
}

export async function getPromptWithGating(
  _promptId: string,
  _userId: string,
): Promise<PromptWithGatingDTO | null> {
  return null;
}

export async function getPromptThread(
  _promptId: string,
  _userId: string,
): Promise<PromptThreadDTO | null> {
  return null;
}

export async function completePrompt(
  _promptId: string,
  _userId: string,
  _response: string,
  _isShared: boolean = false,
): Promise<CompletePromptResult> {
  return retired();
}

export async function toggleWitness(
  _completionId: string,
  _userId: string,
): Promise<{ active: boolean }> {
  return retired();
}

export async function toggleResonated(
  _completionId: string,
  _userId: string,
): Promise<{ active: boolean }> {
  return retired();
}

export async function upsertAnalysis(
  _completionId: string,
  _authorId: string,
  _content: string,
): Promise<{ id: string }> {
  return retired();
}

export async function requestAnalysisPublic(
  _analysisId: string,
  _userId: string,
): Promise<void> {
  return retired();
}

export async function withdrawAnalysisPublicRequest(
  _analysisId: string,
  _userId: string,
): Promise<void> {
  return retired();
}

export async function approveAnalysisPublic(
  _analysisId: string,
  _userId: string,
): Promise<void> {
  return retired();
}

export async function declineAnalysisPublic(
  _analysisId: string,
  _userId: string,
): Promise<void> {
  return retired();
}

export async function makeAnalysisPrivateAgain(
  _analysisId: string,
  _userId: string,
): Promise<void> {
  return retired();
}

export async function getReflectionArchive(_userId: string) {
  return [];
}
