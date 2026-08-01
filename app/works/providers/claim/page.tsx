import { redirect } from "next/navigation";

export default function WorksProviderClaimPage() {
  redirect("/works/providers/join?tab=business&mode=claim");
}
