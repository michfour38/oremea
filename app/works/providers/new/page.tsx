import { redirect } from "next/navigation";

export default function WorksNewProviderPage() {
  redirect("/works/providers/join?tab=business&mode=add");
}
