import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";
import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "@/src/lib/recognition/recognition-pricing";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: {
    access?: string;
  };
};

function CheckoutAction({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <span className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-500">
        Checkout connection pending
      </span>
    );
  }

  return (
    <a
      href={href}
      className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
    >
      {label}
    </a>
  );
}

export default async function RecognitionPurchasePage({ searchParams }: Props) {
  const user = await currentUser();
  if (user) {
    const emails = user.emailAddresses
      .map((item) => item.emailAddress.trim().toLowerCase())
      .filter(Boolean);
    const access = await getRecognitionConversationAccess({
      userId: user.id,
      emails,
    });

    if (access.active) {
      redirect("https://recognition.oremea.com/begin");
    }
  }

  const subscriptionCheckout =
    process.env.RECOGNITION_SUBSCRIPTION_CHECKOUT_URL?.trim() || null;
  const launchPrice = formatRecognitionPrice(RECOGNITION_PRICING.launchPriceCents);
  const regularPrice = formatRecognitionPrice(RECOGNITION_PRICING.regularPriceCents);
  const accessRequired = searchParams?.access === "required";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 md:hidden"
        style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
      />
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat opacity-40 md:block"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="fixed inset-0 z-10 bg-black/70" />

      <section className="relative z-20 mx-auto max-w-3xl px-6 py-12 md:py-16">
        <header className="mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            Recognition
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            A private AI discussion journal for thoughts that need more than a journal page
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-300">
            Bring whatever has your attention. Recognition stays with what you
            actually say, notices distinctions and recurrence, and can bring your
            own earlier words back when they matter.
          </p>
        </header>

        {accessRequired ? (
          <div className="mt-8 rounded-2xl border border-[#7b6338] bg-[#17130c] px-5 py-4 text-sm leading-7 text-[#e4d3ae]">
            No active Recognition access was found for an email on this signed-in
            account. Use the same email at checkout, or sign in with the account
            that already has Recognition.
          </div>
        ) : null}

        <div className="mt-10">
          <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]">
                  Monthly access
                </p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                  Ongoing Recognition
                </h2>
              </div>
              <div className="text-right">
                {regularPrice !== launchPrice ? (
                  <p className="text-sm text-zinc-500 line-through">
                    {regularPrice}/month
                  </p>
                ) : null}
                <p className="mt-1 text-3xl text-[#f1dfb4]">
                  {launchPrice}<span className="ml-1 text-sm text-zinc-500">/month</span>
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              There is no fixed question sequence and no required destination.
              Recognition is one continuing private conversation: return whenever
              something needs somewhere to continue, and the conversation can bring
              forward your own earlier evidence without treating old AI output as
              truth.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Your full private conversation remains available to you. You can
              inspect or remove carried-forward memory, clear remembered excerpts,
              or delete the ongoing conversation and start fresh without affecting
              your access.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Subscribe with an email on the Oremea account you will use for
              Recognition. Active membership keeps the ongoing conversation available.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <CheckoutAction
                href={subscriptionCheckout}
                label={`Open Recognition · ${launchPrice}/month`}
              />
              <Link
                href="/sign-in?redirect_url=%2Fbegin"
                className="text-sm text-zinc-400 underline underline-offset-4 transition hover:text-[#f1dfb4]"
              >
                Already have access? Sign in
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <p className="leading-7 text-zinc-500">
            Prices are shown and charged in US dollars
          </p>
          <Link
            href="https://recognition.oremea.com/archive"
            className="text-zinc-400 underline underline-offset-4 transition hover:text-[#f1dfb4]"
          >
            Open Recognition Archive
          </Link>
        </div>
      </section>
    </main>
  );
}
