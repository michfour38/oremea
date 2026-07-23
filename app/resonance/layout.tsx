import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function ResonanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { onboarding_done: true },
  });

  if (!profile || !profile.onboarding_done) {
    redirect("/onboarding/welcome");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <span className="font-semibold text-[#2D4A3E]">Resonance</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
