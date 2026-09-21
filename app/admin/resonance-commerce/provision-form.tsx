"use client";

import { useActionState, type ReactNode } from "react";
import { provisionResonanceCommerce } from "./actions";

export function ProvisionForm({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [failure, action, pending] = useActionState(provisionResonanceCommerce, null);

  return (
    <form action={action} className="mt-6">
      {failure ? (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
          <p className="font-medium">Provisioning stopped. Public checkout was not enabled.</p>
          <p className="mt-2">
            Stage: {failure.stage} · {failure.code}
            {failure.providerStatus ? ` · Whop HTTP ${failure.providerStatus}` : ""}
          </p>
          {failure.providerDetails?.message ? (
            <p className="mt-2 whitespace-pre-wrap break-words">Whop reason: {failure.providerDetails.message}</p>
          ) : (
            <p className="mt-2">{failure.providerStatus
                ? "Whop did not provide a readable reason. The status alone does not identify the cause."
                : "Oremea could not validate or save the expected commerce data. Check the stage above."}</p>
          )}
          {failure.providerDetails?.code ? (
            <p className="mt-2 break-words">Whop code: {failure.providerDetails.code}</p>
          ) : null}
          {failure.providerDetails?.requestId ? (
            <p className="mt-2 break-words">Request ID: {failure.providerDetails.requestId}</p>
          ) : null}
          <p className="mt-2 text-xs text-amber-100/60">These diagnostics are visible only in this private admin setup.</p>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!enabled || pending}
        className="rounded-full border border-[#b79a63]/50 bg-[#b79a63]/10 px-6 py-3 text-sm text-[#e2c78e] transition hover:border-[#b79a63]/80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Provisioning…" : children}
      </button>
    </form>
  );
}
