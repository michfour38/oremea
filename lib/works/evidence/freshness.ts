export const WORKS_EVIDENCE_FRESHNESS_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1_000;

export function worksEvidenceAgeDays(
  updatedAt: Date,
  now = new Date(),
) {
  return Math.max(0, (now.getTime() - updatedAt.getTime()) / DAY_MS);
}

export function isWorksEvidenceFresh(
  updatedAt: Date,
  now = new Date(),
) {
  return worksEvidenceAgeDays(updatedAt, now) <= WORKS_EVIDENCE_FRESHNESS_DAYS;
}

export function worksEvidencePublicLabel(
  status: "SELF_REPORTED" | "SOURCE_REVIEWED" | "VERIFIED",
  updatedAt: Date,
  now = new Date(),
) {
  if (status === "SELF_REPORTED") return "Provider supplied · review pending";
  if (!isWorksEvidenceFresh(updatedAt, now)) return "Previously reviewed · needs reconfirmation";
  return status === "VERIFIED" ? "Verified evidence" : "Source reviewed";
}
