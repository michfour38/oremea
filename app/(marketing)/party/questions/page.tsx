import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { submitPartyQuestion } from "./actions";

export const metadata: Metadata = {
  title: "Questions Box | Oremea",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PartyQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sent?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = query.token?.trim() || "";
  const registration =
    UUID_PATTERN.test(token)
      ? await prisma.oremea_party_registrations.findUnique({
          where: { questions_token: token },
          select: { first_name: true },
        })
      : null;

  if (!registration) {
    return (
      <main className="min-h-screen bg-[#080704] px-6 py-20 text-white">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 md:p-9">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]">Oremea</p>
          <h1 className="mt-4 font-serif text-4xl font-light">Questions Box</h1>
          <p className="mt-5 text-base leading-8 text-zinc-300">
            Open the private Questions Box link from the welcome email for this registration.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080704] px-6 py-20 text-white">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#c8a96a]/25 bg-[#15120c] p-7 md:p-9">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]">Questions Box</p>
        <h1 className="mt-4 font-serif text-4xl font-light">
          Add what comes up.
        </h1>
        <p className="mt-5 text-base leading-8 text-zinc-300">
          A question, pattern, example, contradiction, or thought is enough. There is no need to explain the whole story.
          The box can be used again whenever something else becomes relevant before the live session.
        </p>

        {query.sent ? (
          <p className="mt-6 rounded-2xl border border-[#c8a96a]/25 bg-[#c8a96a]/10 p-4 text-sm leading-6 text-[#f1dfb4]">
            Received. Add another whenever something else comes up.
          </p>
        ) : null}

        {query.error ? (
          <p role="alert" className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-100/5 p-4 text-sm text-amber-100">
            Add a question before sending.
          </p>
        ) : null}

        <form action={submitPartyQuestion} className="mt-7">
          <input type="hidden" name="token" value={token} />
          <label className="block text-sm leading-6 text-zinc-200">
            What would you like brought into the room?
            <textarea
              name="question"
              required
              maxLength={3000}
              rows={6}
              placeholder="Write it in your own words."
              className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#c8a96a]/60"
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full border border-[#c8a96a]/60 bg-[#c8a96a]/10 px-6 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/15"
          >
            Add to the Questions Box
          </button>
        </form>
      </section>
    </main>
  );
}
