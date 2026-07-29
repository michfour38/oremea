import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ResumePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/entry");
  }

  // The old enter → begin → resonance resume ladder is retired.
  // Authenticated participants resume from the product home, which resolves
  // Resonance access from their active purchased run.
  redirect("/entry");
}
