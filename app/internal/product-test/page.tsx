import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { recoverOremeaOwnerAccess } from "@/src/lib/oremea/owner-recovery";
import {
  PRODUCT_TEST_TARGETS,
  getProductTestTarget,
  hasProductTestOwnerAccess,
  resetProductTestState,
} from "@/src/lib/testing/product-test-reset";

export const metadata: Metadata = {
  title: "Product Test Reset | Oremea",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

type ProductTestOwnerStatus = {
  active: boolean;
  reason:
    | "active"
    | "clerk_user_missing"
    | "email_not_verified"
    | "email_not_approved"
    | "recovery_failed";
  maskedEmail: string | null;
};

function maskEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  const at = email.indexOf("@");
  if (at <= 0) return null;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visibleLocal = local.length <= 2 ? local[0] ?? "" : local.slice(0, 2);
  return `${visibleLocal}${"•".repeat(Math.max(3, local.length - visibleLocal.length))}@${domain}`;
}

async function getProductTestOwnerStatus(
  userId: string,
): Promise<ProductTestOwnerStatus> {
  try {
    if (await hasProductTestOwnerAccess(userId)) {
      return { active: true, reason: "active", maskedEmail: null };
    }

    const user = await currentUser();
    if (!user || user.id !== userId) {
      return {
        active: false,
        reason: "clerk_user_missing",
        maskedEmail: null,
      };
    }

    const verifiedEmails = user.emailAddresses
      .filter((item) => item.verification?.status === "verified")
      .map((item) => item.emailAddress.trim().toLowerCase())
      .filter(Boolean);

    const maskedEmail = maskEmail(
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress,
    );

    if (verifiedEmails.length === 0) {
      return {
        active: false,
        reason: "email_not_verified",
        maskedEmail,
      };
    }

    const recovery = await recoverOremeaOwnerAccess({
      userId,
      verifiedEmails,
    });

    return recovery.active
      ? { active: true, reason: "active", maskedEmail }
      : {
          active: false,
          reason: "email_not_approved",
          maskedEmail,
        };
  } catch (error) {
    console.error("Owner demo access recovery failed:", error);
    return {
      active: false,
      reason: "recovery_failed",
      maskedEmail: null,
    };
  }
}

function accessMessage(status: ProductTestOwnerStatus) {
  if (status.reason === "email_not_verified") {
    return "This Clerk account is signed in, but its email is not verified yet. Complete Clerk's email verification, then refresh this page.";
  }

  if (status.reason === "email_not_approved") {
    return "This signed-in Clerk account does not match the owner-approved demo identity. Sign out, sign in with the demo email you approved for Oremea, verify it, then return here.";
  }

  if (status.reason === "clerk_user_missing") {
    return "Oremea can see a session but Clerk did not return the matching user record. Sign out, sign back in, then return to this page.";
  }

  return "Oremea could not initialise owner demo access. Your product data has not been changed. Refresh once; if this remains, the server-side recovery path needs attention.";
}

async function resetAndOpen(formData: FormData) {
  "use server";

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const status = await getProductTestOwnerStatus(userId);
  if (!status.active) redirect("/internal/product-test?access=denied");

  const target = getProductTestTarget(formData.get("target"));
  if (!target) {
    throw new Error("Unknown product test target.");
  }

  await resetProductTestState({ userId, target });
  redirect(target.href);
}

export default async function ProductTestPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const status = await getProductTestOwnerStatus(userId);

  if (!status.active) {
    return (
      <main className="min-h-screen bg-[#070707] px-5 py-12 text-zinc-100 sm:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#c8a96a]/25 bg-white/[0.035] p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#c8a96a]">
            Oremea · owner demo access
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            The page is working. Access is not attached to this Clerk session yet.
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-300">
            {accessMessage(status)}
          </p>
          {status.maskedEmail ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-zinc-400">
              Signed-in email: <span className="text-zinc-200">{status.maskedEmail}</span>
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/internal/product-test"
              className="rounded-full border border-[#c8a96a]/50 bg-[#c8a96a]/10 px-5 py-2.5 text-sm font-medium text-[#ead8ad]"
            >
              Retry access
            </a>
            <a
              href="/"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-300"
            >
              Return to Oremea
            </a>
          </div>
          <p className="mt-7 text-sm leading-6 text-zinc-500">
            No Clerk identity, Whop purchase, entitlement, product configuration
            or participant history is deleted by this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#c8a96a]">
            Owner test surface · noindex
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Start every Oremea product clean.
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-400">
            Each button clears only your test state for that product, then opens
            its real participant-facing start. Your Clerk identity, Oremea
            profile, Whop records, entitlements, purchase references and product
            configuration are not deleted.
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-100/[0.04] p-4 text-sm leading-6 text-zinc-300">
            Resonance is isolated room-by-room for this audit. Earlier test runs
            are preserved out of the live chronology rather than deleted, so a
            fresh room cannot inherit old reflections. If a room has never had a
            run, an owner-only test run is created without pretending it was a
            customer sale.
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {PRODUCT_TEST_TARGETS.map((target, index) => (
            <article
              key={target.key}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    {String(index + 1).padStart(2, "0")} · {target.kind}
                  </p>
                  <h2 className="mt-2 text-xl font-medium text-white">
                    {target.label}
                  </h2>
                  {target.kind === "resonance" ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Room {target.weekNumber} · clean seven-day run
                    </p>
                  ) : target.kind === "current" ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Resets qualification and invitation test state only; The
                      Current remains private by product truth.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">
                      Clears participant test progress only.
                    </p>
                  )}
                </div>

                <form action={resetAndOpen}>
                  <input type="hidden" name="target" value={target.key} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-[#c8a96a]/50 bg-[#c8a96a]/10 px-4 py-2 text-sm font-medium text-[#ead8ad] transition hover:bg-[#c8a96a]/20"
                  >
                    Reset & open
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-10 border-t border-white/10 pt-6 text-sm leading-6 text-zinc-500">
          This page is deliberately absent from public navigation. Use it only
          for the owner audit of Transparency · Contrast · Curiosity ·
          Participant authorship.
        </footer>
      </div>
    </main>
  );
}
