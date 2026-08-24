// app/(app)/onboarding/welcome/page.tsx
//
// Sprint 0 stub — exists solely to prevent the 404 that fires when
// app/(app)/layout.tsx redirects users with no profile or incomplete
// onboarding to /onboarding/welcome.
//
// Full onboarding flow (pathway selection, worldview, profile creation)
// is implemented in Sprint 1. Do not build UI here — replace this file
// entirely in Sprint 1.

import { auth } from '@clerk/nextjs/server';

export default async function OnboardingWelcomePage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-semibold text-[#2D4A3E] mb-3">
          Welcome to Resonance
        </h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Your account is set up. Onboarding will be available shortly.
        </p>

        {/* Sprint 0 debug — remove in Sprint 1 */}
        <p className="text-xs text-stone-400 font-mono bg-stone-100 rounded px-3 py-2 inline-block">
          Clerk userId: {userId}
        </p>

        <p className="mt-8 text-xs text-stone-400 italic">
          Sprint 1 — onboarding flow coming soon
        </p>
      </div>
    </div>
  );
}
