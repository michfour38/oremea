import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasSustainProductAccess, isSustainProduct } from "@/src/lib/integrations/sustain-bridge";
import SustainLinkConfirmation from "./sustain-link-confirmation";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Connect SUSTAIN | Oremea",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer" as const,
};
const paths = { recognition: "/recognition", compass: "/compass", resonance: "/resonance" } as const;
const names = { recognition: "Recognition", compass: "Compass", resonance: "Resonance" } as const;

export default async function SustainConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; code?: string }>;
}) {
  const query = await searchParams;
  if (!isSustainProduct(query.product) || !/^[a-f0-9]{64}$/.test(query.code ?? "")) {
    return <main style={{ maxWidth: 650, margin: "72px auto", padding: 24 }}>
      <h1>Connection not available</h1><p>Return to SUSTAIN and begin again</p>
    </main>;
  }

  const { userId } = await auth();
  if (!userId) {
    const returnTo = "/integrations/sustain/connect?product=" +
      encodeURIComponent(query.product) + "&code=" + encodeURIComponent(query.code!);
    redirect("/sign-in?redirect_url=" + encodeURIComponent(returnTo));
  }
  const user = await currentUser();
  const emails = user?.emailAddresses.map(item => item.emailAddress.trim().toLowerCase()).filter(Boolean) ?? [];
  const available = await hasSustainProductAccess(userId, query.product, emails);

  return <main style={{ maxWidth: 650, margin: "60px auto", padding: 24, lineHeight: 1.6 }}>
    <p style={{ letterSpacing: 2, fontSize: 12 }}>OREMEA · SUSTAIN CONNECTIONS</p>
    <h1>Connect SUSTAIN to {names[query.product]}</h1>
    {available ? <>
      <p>You're signed in to Oremea</p>
      <p>Confirm this connection to let {names[query.product]} read only the personal references you deliberately add for it in SUSTAIN</p>
      <p>Shared household memory, other people's private entries and Finance data stay outside this connection</p>
      <p>Disconnect in SUSTAIN at any time to stop further access</p>
      <SustainLinkConfirmation code={query.code!} product={query.product} destination={paths[query.product]} />
    </> : <>
      <h2>Product access required</h2>
      <p>Your current Oremea account doesn't have active {names[query.product]} access</p>
      <p>Connecting SUSTAIN does not unlock paid products or start a free pass</p>
      <Link href={paths[query.product]}>See {names[query.product]}</Link>
      <p>After access is active, begin a new connection from SUSTAIN</p>
    </>}
  </main>;
}
