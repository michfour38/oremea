import { redirect } from "next/navigation";

export default function LegacyReviewSubmitPage() {
  redirect("/reviews/share");
}
