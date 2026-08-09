import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const RESONANCE_TESTER_USER_ID = "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

export default async function ResonanceTestPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=%2F");
  }

  if (userId !== RESONANCE_TESTER_USER_ID) {
    redirect("/");
  }

  redirect("/");
}
