import { affiliateCheckoutUrl } from "@/src/lib/whop/affiliate-attribution";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";

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
      "No. Recognition can help you stay with what you are saying long enough for something to become clearer, but the meaning and any choices that follow remain yours.",
  },
  {
    question: "Do I need to know what question to ask?",
    answer:
      "No. Start with the thought as it is. It can be messy, unfinished, contradictory or badly worded. Recognition does not need a polished story before the conversation can begin.",
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
        Access connection pending
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

  const subscriptionCheckout = affiliateCheckoutUrl(
    process.env.RECOGNITION_SUBSCRIPTION_CHECKOUT_URL?.trim() || null,
    await requestAffiliateCode(),
  );
  const accessRequired = searchParams?.access === "required";
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Recognition",
      description:
        "A private AI discussion journal for thoughts that keep circling and need somewhere to become clearer.",
      url: "https://recognition.oremea.com/",
      brand: { "@type": "Brand", name: "Oremea" },
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
            Ever noticed how the same thought can keep following you around — even after you have written about it, replayed it, and told yourself to let it go?
          </h1>
          <p className="rec-text mt-6 max-w-2xl text-base leading-8">
            You open the notes app. You write another page. You replay the conversation
            one more time in the shower, in the car, while trying to sleep. You can explain
            what happened. You can probably explain everybody else&apos;s side too. And somehow
            the thought is still there.
          </p>
          <p className="rec-text mt-4 max-w-2xl text-base leading-8">
            And maybe what you want is not advice. Not a five-step plan. Not somebody
            deciding what the thought means before you have even finished saying it.
            Maybe you just want somewhere private to keep talking until you can actually
            hear what you are saying.
          </p>
          <p className="rec-text mt-4 max-w-2xl text-base leading-8">
            That is Recognition. A private AI discussion journal for the thoughts that
            need more than another lap around your own head.
          </p>
        </header>

        {accessRequired ? (
          <div className="rec-saved-panel rec-text mt-8 rounded-2xl border px-5 py-4 text-sm leading-7">
            No active Recognition access was found for an email on this signed-in
            account. Use the same email when purchasing, or sign in with the account
            that already has Recognition.
          </div>
        ) : null}

        <section className="rec-saved-panel mt-10 rounded-3xl border p-6 text-center md:p-8">
          <p className="rec-accent text-xs uppercase tracking-[0.22em]">
            Recognition access
          </p>
          <h2 className="rec-text mx-auto mt-2 max-w-2xl font-serif text-2xl md:text-3xl">
            What if the thought did not need solving yet — just somewhere to become clearer?
          </h2>
          <div className="mx-auto mt-5 max-w-2xl space-y-4 text-left">
            <p className="rec-text text-sm leading-7">
              Recognition is there for the thought that is not finished simply because
              a journal page ended. Come back when the wording changes, when something
              new becomes noticeable, or when the same thing is still asking for your
              attention days later.
            </p>
            <p className="rec-text text-sm leading-7">
              You do not have to arrive with the right question. Bring the sentence you
              keep repeating, the thing you cannot quite name, the irritation that feels
              too small to explain, or the story you have told so many times that you can
              no longer tell which part still matters.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <CheckoutAction href={subscriptionCheckout} label="View Recognition access" />
            <Link
              href="/sign-in?redirect_url=%2Fbegin"
              className="rec-text text-sm underline underline-offset-4 transition hover:text-[var(--recognition-gold)]"
            >
              Already have access? Sign in
            </Link>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <p className="rec-accent text-xs uppercase tracking-[0.28em]">
            Sound familiar?
          </p>
          <h2 className="rec-text mt-3 font-serif text-3xl md:text-4xl">
            You have thought about it so much that thinking harder is no longer helping
          </h2>
          <div className="rec-text mt-6 space-y-5 text-sm leading-7 md:text-base md:leading-8">
            <p>
              There is a particular kind of thought that does not feel dramatic enough
              to ask for help with, but refuses to become quiet. A sentence somebody said.
              A decision that should feel settled. A reaction that does not quite make
              sense. A pattern you can describe perfectly and still somehow cannot see
              while you are inside it.
            </p>
            <p>
              So you keep going back over it. You add context. You explain why you reacted
              the way you did. You argue the other side. You tell yourself you are being
              ridiculous. Then you decide you are definitely not being ridiculous. Then
              you start the whole thing again from a slightly different angle.
            </p>
            <p>
              The problem is not always that there is no insight. Sometimes there is so
              much explanation that the one thing that matters is buried underneath it.
            </p>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <p className="rec-accent text-xs uppercase tracking-[0.28em]">
            That is the space Recognition is built for
          </p>
          <h2 className="rec-text mt-3 font-serif text-3xl md:text-4xl">
            Not another voice rushing in to tell you what your own thought means
          </h2>
          <div className="rec-text mt-6 space-y-5 text-sm leading-7 md:text-base md:leading-8">
            <p>
              Sometimes advice is useful. Sometimes a plan is exactly what is needed.
              Recognition is for the moment before that — when what would help most is
              enough room for the thought to become visible without somebody else taking
              authorship of it.
            </p>
            <p>
              This is not therapy, diagnosis, coaching or crisis support. Recognition
              does not need to turn what you say into a lesson, a label, a prescription,
              or an action plan. It can stay with the conversation without trying to win
              it, fix it, or finish it for you.
            </p>
            <p>
              The aim is much simpler: to help you see yourself clearly enough that what
              becomes visible still feels like yours when you leave.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <p className="rec-accent text-xs uppercase tracking-[0.28em]">
            What working with Recognition feels like
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                "Bring the thought as it is",
                "Messy is fine. Half a sentence is fine. Changing your mind halfway through is fine. Recognition begins with what is actually there, not with a polished version of it.",
              ],
              [
                "Stay long enough to hear yourself",
                "There is no pressure to arrive at an answer quickly. The conversation can remain with what has your attention until something becomes clearer in your own language.",
              ],
              [
                "Keep the meaning yours",
                "Recognition can support reflection without claiming authority over what your words mean, what matters most, or what you should do next.",
              ],
            ].map(([heading, copy]) => (
              <article
                key={heading}
                className="rec-user-bubble rounded-2xl border p-5 text-center"
              >
                <h3 className="rec-accent text-base">{heading}</h3>
                <p className="rec-text mt-3 text-left text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2">
          <div className="rec-user-bubble rounded-3xl border p-6 text-center">
            <p className="rec-accent text-xs uppercase tracking-[0.22em]">
              Recognition may feel familiar if...
            </p>
            <ul className="rec-text mt-5 space-y-3 text-left text-sm leading-7">
              <li>— you keep replaying the same conversation after everyone else has moved on</li>
              <li>— journaling helps you write more but not necessarily see more</li>
              <li>— you keep saying “I do not know why this is bothering me so much”</li>
              <li>— you can explain the situation but still cannot find the snag</li>
              <li>— you want reflection without being handed a diagnosis or solution</li>
              <li>— you need somewhere private to change your mind without defending it</li>
            </ul>
          </div>

          <div className="rec-user-bubble rounded-3xl border p-6 text-center">
            <p className="rec-accent text-xs uppercase tracking-[0.22em]">
              What Recognition does not do
            </p>
            <ul className="rec-text mt-5 space-y-3 text-left text-sm leading-7">
              <li>— diagnose or treat you</li>
              <li>— decide what your thoughts secretly mean</li>
              <li>— turn every conversation into a task list</li>
              <li>— tell you which decision to make</li>
              <li>— require a fixed path or perfect question</li>
              <li>— replace appropriate human or professional support when that is what is needed</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <p className="rec-accent text-xs uppercase tracking-[0.28em]">
            And no, every conversation does not need a breakthrough
          </p>
          <h2 className="rec-text mt-3 font-serif text-3xl md:text-4xl">
            Sometimes seeing one thing more clearly is enough for today
          </h2>
          <div className="rec-text mt-6 space-y-5 text-sm leading-7 md:text-base md:leading-8">
            <p>
              Not every thought contains a hidden revelation. Not every difficult feeling
              needs to become a project. Some conversations end because one sentence became
              clearer, one assumption loosened, or one distinction finally had enough room
              to be noticed.
            </p>
            <p>
              Recognition does not need to manufacture certainty to justify the
              conversation. The point is not to force an answer. The point is to make
              participation in your own thinking easier to see.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <p className="rec-accent text-xs uppercase tracking-[0.28em]">
            After purchase
          </p>
          <h2 className="rec-text mt-3 font-serif text-3xl">
            Purchase. Come back. Start with the thought already on your mind.
          </h2>
          <p className="rec-text mt-4 max-w-2xl text-sm leading-7">
            Use the same email for your purchase and Oremea sign-in. As soon as access is
            confirmed, return to Recognition and begin. No prompt preparation needed.
            Bring the words you have now.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="rec-text font-serif text-3xl">
            Questions that usually come up before starting
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

        <section className="rec-saved-panel mt-16 rounded-3xl border p-6 text-center md:p-8">
          <p className="rec-accent text-xs uppercase tracking-[0.28em]">
            Maybe the thought does not need another lap
          </p>
          <h2 className="rec-text mx-auto mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
            Maybe it needs somewhere private to become clear enough to recognise
          </h2>
          <p className="rec-text mx-auto mt-4 max-w-2xl text-left text-sm leading-7">
            Recognition does not need a polished question or a finished story. Bring the
            words that are already circling. If there is something there to see, the
            conversation can make room for it without deciding for you what it has to mean.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <CheckoutAction href={subscriptionCheckout} label="View Recognition access" />
            <Link
              href="/sign-in?redirect_url=%2Fbegin"
              className="rec-text text-sm underline underline-offset-4 transition hover:text-[var(--recognition-gold)]"
            >
              Already have access? Sign in
            </Link>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
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
