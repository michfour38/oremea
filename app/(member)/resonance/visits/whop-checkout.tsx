"use client";

import { WhopCheckoutEmbed } from "@whop/checkout/react";

export function ResonanceWhopCheckout({
  sessionId,
  buyerEmail,
  returnUrl,
}: {
  sessionId: string;
  buyerEmail: string;
  returnUrl: string;
}) {
  return (
    <WhopCheckoutEmbed
      key={sessionId}
      sessionId={sessionId}
      environment="production"
      returnUrl={returnUrl}
      theme="dark"
      prefill={{ email: buyerEmail }}
      disableEmail
      setupFutureUsage="off_session"
      fallback={
        <div
          role="status"
          className="res-text-primary flex min-h-[420px] items-center justify-center text-sm"
        >
          Loading secure checkout…
        </div>
      }
    />
  );
}
