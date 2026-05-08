import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getEntryResumeState } from "../enter/actions";

export default async function ResumePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/oremea/resume");
  }

  const email =
    user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
    user.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
    "";

  if (!email) {
    redirect("/oremea/enter");
  }

  const resume = await getEntryResumeState({ email });

  if (resume.destination === "journey") {
    redirect("/journey");
  }

  if (resume.destination === "begin") {
    redirect("/oremea/begin");
  }

  redirect("/oremea/enter");
}