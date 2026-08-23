"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { WorksAccountButton } from "@/components/works/works-account-button";
import { WorksPageHeader } from "@/components/works/works-brand";

type VerificationResult = {
  verified?: boolean;
  accessGranted?: boolean;
  message?: string;
  error?: string;
};

export function ProviderClaimVerification() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setToken(params.get("token")?.trim() ?? "");
    setReady(true);
  }, []);

  async function verify() {
    if (!token) return;
    try {
      setVerifying(true);
      setResult(null);
      const response = await fetch("/api/works/provider-claims/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json() as VerificationResult;
      setResult(data);
      if (response.ok) window.history.replaceState(null, "", window.location.pathname);
    } catch {
      setResult({ error: "WORKS could not verify this connection yet. Please try again." });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8 md:py-8">
        <WorksPageHeader
          context="Business verification"
          action={<SignedIn><WorksAccountButton afterSignOutUrl="/works/za" /></SignedIn>}
        />

        <section className="py-10 md:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">WORKS provider access</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">Confirm before the business profile changes</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">Opening the email does not grant access. Confirm below while signed in to the same WORKS account that requested the connection.</p>

          {!ready ? <p className="mt-8 text-sm text-black/45">Opening secure verification…</p> : null}
          {ready && !token && !result ? <p className="mt-8 rounded-2xl bg-white p-5 text-sm text-red-700">This verification link is incomplete. Return to WORKS and request a new email.</p> : null}

          <SignedOut>
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 md:p-8">
              <h2 className="font-serif text-3xl">Sign in to continue</h2>
              <p className="mt-3 text-sm leading-7 text-black/55">Use the same WORKS account that requested the business connection.</p>
              <SignInButton mode="modal">
                <button className="mt-6 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {!result?.verified ? (
              <button type="button" onClick={() => void verify()} disabled={!token || verifying} className="mt-8 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">
                {verifying ? "Verifying…" : "Verify business email and connect →"}
              </button>
            ) : null}
          </SignedIn>

          {result?.error ? <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-red-700">{result.error}</p> : null}
          {result?.verified ? (
            <div className="mt-8 rounded-3xl bg-[#1f1c17] p-6 text-white md:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#78d7a4]">Email verified</p>
              <h2 className="mt-3 font-serif text-3xl">{result.accessGranted ? "Business connected" : "Verification recorded"}</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">{result.message}</p>
              <a href={result.accessGranted ? "/works/provider/capabilities" : "/works/providers/join?tab=progress"} className="mt-6 inline-flex rounded-full bg-[#d7bd82] px-6 py-3 text-sm font-medium text-[#1f1c17]">
                {result.accessGranted ? "Add business capabilities →" : "Return to claim progress →"}
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
