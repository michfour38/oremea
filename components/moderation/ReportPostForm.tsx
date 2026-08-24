import { reportPostAction } from "@/domains/moderation/report-post.action";
import { auth } from "@clerk/nextjs/server";

type Props = {
  reportedUserId: string;
  reportedPostId: string;
  reason?: string;
};

export async function ReportPostForm({
  reportedUserId,
  reportedPostId,
  reason = "In-app user report",
}: Props) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return (
    <form action={reportPostAction} className="space-y-2">
      <input type="hidden" name="reportedUserId" value={reportedUserId} />
      <input type="hidden" name="reportedPostId" value={reportedPostId} />
      <input type="hidden" name="reason" value={reason} />

      <button
        type="submit"
        className="text-xs px-2 py-1 rounded border hover:bg-muted"
      >
        Report post
      </button>
    </form>
  );
}