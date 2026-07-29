export type RankableWorksMatch = {
  status: "MATCH" | "NO_MATCH" | "UNKNOWN";
  fit_score: number | null;
  covered_step_count: number;
  matched_count: number;
  unknown_count: number;
  failed_count: number;
};

const STATUS_RANK: Record<RankableWorksMatch["status"], number> = {
  MATCH: 3,
  UNKNOWN: 2,
  NO_MATCH: 1,
};

export function compareWorksMatches(
  left: RankableWorksMatch,
  right: RankableWorksMatch
): number {
  const statusDifference = STATUS_RANK[right.status] - STATUS_RANK[left.status];
  if (statusDifference !== 0) return statusDifference;

  const coverageDifference = right.covered_step_count - left.covered_step_count;
  if (coverageDifference !== 0) return coverageDifference;

  const scoreDifference = (right.fit_score ?? 0) - (left.fit_score ?? 0);
  if (scoreDifference !== 0) return scoreDifference;

  const failedDifference = left.failed_count - right.failed_count;
  if (failedDifference !== 0) return failedDifference;

  return left.unknown_count - right.unknown_count;
}
