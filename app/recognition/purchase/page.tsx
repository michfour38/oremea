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
      <span className="rec-text inline-flex rounded-xl border border-[var(--recognition-user-border)] px-5 py-3 text-sm">
        Checkout connection pending
      </span>
    );
  }

  return (
    <a
      href={href}
      className="rec-accent inline-flex rounded-xl border border-[var(--recognition-gold)] px-5 py-3 text-sm transition hover:bg-[color-mix(in_srgb,var(--recognition-gold)_10%,transparent)]"
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
    <main className="relative min-h-screen overflow-x-hidden">
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
      <div
        className="fixed inset-0 z-10"
        style={{ backgroundColor: "color-mix(in srgb, var(--recognition-bg) 70%, transparent)" }}
      />

      <section className="relative z-20 mx-auto max-w-4xl px-6 py-12 md:py-16">
        <header className="mt-12 max-w-3xl">
          <p className="rec-accent text-xs uppercase tracking-[0.3em]">
            Recognition · Help me see myself
          </p>
          <h1 className="rec-text mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            A private AI discussion journal for thoughts that need more than a
            journal page
          </h1>
          <p className="rec-text mt-6 max-w-2xl text-base leading-8">
            Bring whatever has your attention. Recognition stays close to your
            own words and one live thread. It can notice distinctions,
            recurrence and unfinished thought without deciding what any of it
            means for you.
          </p>
        </header>

        {accessRequired ? (
          <div className="rec-saved-panel rec-text mt-8 rounded-2xl border px-5 py-4 text-sm leading-7">
            No active Recognition access was found for an email on this signed-in
            account. Use the same email at checkout, or sign in with the account
            that already has Recognition.
          </div>
        ) : null}

        <section className="rec-saved-panel mt-10 rounded-3xl border p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="rec-accent text-xs uppercase tracking-[0.22em]">
                Monthly access
              </p>
              <h2 className="rec-text mt-2 font-serif text-2xl">
                Ongoing Recognition
              </h2>
            </div>
            <div className="text-right">
              {regularPrice !== launchPrice ? (
                <p className="rec-text text-sm line-through">
                  {regularPrice}/month
                </p>
              ) : null}
              <p className="rec-accent mt-1 text-3xl">
                {launchPrice}
                <span className="rec-text ml-1 text-sm">/month</span>
              </p>
            </div>
          </div>

          <p className="rec-text mt-5 text-sm leading-7">
            There is no fixed question sequence and no required destination.
            Return whenever a thought needs somewhere to continue. Earlier
            participant-written evidence can return when it materially clarifies
            recurrence, correction, contrast or a distinction you are holding.
          </p>
          <p className="rec-text mt-4 text-sm leading-7">
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
              className="rec-text text-sm underline underline-offset-4 transition hover:text-[var(--recognition-gold)]"
            >
              Already have access? Sign in
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="rec-text font-serif text-3xl">
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
                className="rec-user-bubble rounded-2xl border p-5"
              >
                <h3 className="rec-accent text-base">{heading}</h3>
                <p className="rec-text mt-3 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rec-user-bubble rounded-3xl border p-6">
            <h2 className="rec-text font-serif text-2xl">
              Recognition may fit when
            </h2>
            <ul className="rec-text mt-5 space-y-3 text-sm leading-7">
              <li>— Writing alone keeps circling the same thought.</li>
              <li>— A distinction is present but not yet clear.</li>
              <li>— You want reflection without advice or a prescribed route.</li>
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="rec-text font-serif text-3xl">
            Recognition questions
          </h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <details
                key={item.question}
                className="rec-user-bubble rounded-2xl border p-5"
              >
                <summary className="rec-accent cursor-pointer text-sm">
                  {item.question}
                </summary>
                <p className="rec-text mt-4 text-sm leading-7">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <p className="rec-text leading-7">
            Prices are shown and charged in US dollars
          </p>
          <Link
            href="https://recognition.oremea.com/archive"
            className="rec-text underline underline-offset-4 transition hover:text-[var(--recognition-gold)]"
          >
            Open Recognition Archive
          </Link>
        </div>
      </section>
    </main>
  );
}
