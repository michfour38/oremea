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

  const processCheckout =
    process.env.RECOGNITION_PROCESS_CHECKOUT_URL?.trim() || null;
  const price = formatRecognitionPrice(RECOGNITION_PRICING.launchPriceCents);
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
            An accountability partner for staying in contact with your own words
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-300">
            Bring whatever has your attention. Recognition stays with what you
            actually say, notices distinctions and recurrence, and can bring your
            own earlier words back when they matter.
          </p>
        </header>

        {accessRequired ? (
          <div className="mt-8 rounded-2xl border border-[#7b6338] bg-[#17130c] px-5 py-4 text-sm leading-7 text-[#e4d3ae]">
            No Recognition purchase was found for the email on this signed-in
            account. Use the same email at checkout, or sign in with the account
            that already purchased Recognition.
          </div>
        ) : null}

        <div className="mt-10">
          <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  One-time purchase
                </p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                  Ongoing Recognition access
                </h2>
              </div>
              <p className="text-3xl text-[#f1dfb4]">{price}</p>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              There is no fixed question sequence and no required destination.
              Recognition becomes one continuing private conversation: return when
              something needs to be seen clearly, and the conversation can remember
              your own earlier evidence without treating old AI output as truth.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Purchase with an email on the Oremea account you will use for
              Recognition. Your account protects the longitudinal conversation from
              anyone who merely knows your email address.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <CheckoutAction
                href={processCheckout}
                label={`Open Recognition · ${price}`}
              />
              <Link
                href="/sign-in?redirect_url=%2Fbegin"
                className="text-sm text-zinc-400 underline underline-offset-4 transition hover:text-[#f1dfb4]"
              >
                Already purchased? Sign in
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
