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
  searchParams?: Promise<{
    access?: string;
  }>;
};

const faq = [
  {
    question: "Is Recognition therapy or coaching?",
    answer:
      "No. Recognition is a private AI discussion journal. It does not diagnose, treat, coach, provide crisis support or turn the conversation into an action plan.",
  },
  {
    question: "Does Recognition tell me what my thoughts mean?",
    answer:
      "No. It can place your own words and distinctions beside one another, but meaning and choices remain yours.",
  },
  {
    question: "Is there a fixed prompt sequence?",
    answer:
      "No. You bring whatever has your attention, and Recognition follows one live thread from what you actually say.",
  },
  {
    question: "What happens to my conversation?",
    answer:
      "Your continuing private conversation remains available while you have access. You can inspect or remove carried-forward memory, clear remembered excerpts, or delete the conversation and begin again.",
  },
] as const;

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

export default async function RecognitionPurchasePage(props: Props) {
  const searchParams = await props.searchParams;
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
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Recognition",
      description:
        "A private AI discussion journal for thoughts that need more than a journal page.",
      url: "https://recognition.oremea.com/",
      brand: { "@type": "Brand", name: "Oremea" },
      offers: {
        "@type": "Offer",
        url: "https://whop.com/oremea/recognition/",
        priceCurrency: RECOGNITION_PRICING.currency,
        price: (RECOGNITION_PRICING.standardPriceCents / 100).toFixed(2),
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 md:hidden"
        style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
      />
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat opacity-40 md:block"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="fixed inset-0 z-10 bg-black/70" />

      <section className="relative z-20 mx-auto max-w-4xl px-6 py-12 md:py-16">
        <header className="mt-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            Recognition · Help me see myself
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            A private AI discussion journal for thoughts that need more than a
            journal page
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Bring whatever has your attention. Recognition stays close to your
            own words and one live thread. It can notice distinctions,
            recurrence and unfinished thought without deciding what any of it
            means for you.
          </p>
        </header>

        {accessRequired ? (
          <div className="mt-8 rounded-2xl border border-[#7b6338] bg-[#17130c] px-5 py-4 text-sm leading-7 text-[#e4d3ae]">
            No active Recognition access was found for an email on this signed-in
            account. Use the same email at checkout, or sign in with the account
            that already has Recognition.
          </div>
        ) : null}

        <section className="mt-10 rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
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
                {launchPrice}
                <span className="ml-1 text-sm text-zinc-500">/month</span>
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-zinc-300">
            There is no fixed question sequence and no required destination.
            Return whenever a thought needs somewhere to continue. Earlier
            participant-written evidence can return when it materially clarifies
            recurrence, correction, contrast or a distinction you are holding.
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Your full private conversation remains available to you. You can
            inspect or remove carried-forward memory, clear remembered excerpts,
            or delete the conversation and start fresh without affecting access.
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

        <section className="mt-12">
          <h2 className="font-serif text-3xl text-white">
            How Recognition works
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                "Bring one live thought",
                "Begin with whatever has your attention, in your own language.",
              ],
              [
                "Stay with the evidence",
                "Recognition can question an absolute or place two of your statements beside one another.",
              ],
              [
                "Keep authorship",
                "A conversation may end with one thing becoming visible. Meaning, choice and action remain yours.",
              ],
            ].map(([heading, copy]) => (
              <article
                key={heading}
                className="rounded-2xl border border-white/10 bg-black/35 p-5"
              >
                <h3 className="text-base text-[#f1dfb4]">{heading}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
            <h2 className="font-serif text-2xl text-white">
              Recognition may fit when
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
              <li>— Writing alone keeps circling the same thought.</li>
              <li>— A distinction is present but not yet clear.</li>
              <li>— You want reflection without advice or a prescribed route.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
            <h2 className="font-serif text-2xl text-white">
              What it will not become
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
              <li>— Therapy, coaching or crisis support.</li>
              <li>— A fixed prompt sequence or personality verdict.</li>
              <li>— An action plan, streak or accountability loop.</li>
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-3xl text-white">
            Recognition questions
          </h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-white/10 bg-black/35 p-5"
              >
                <summary className="cursor-pointer text-sm text-[#f1dfb4]">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
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
