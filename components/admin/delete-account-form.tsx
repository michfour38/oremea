"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import {
  reviewAccountDeletionAction,
  type AccountDeletionReviewState,
} from "@/app/admin/account-access/actions";

const INITIAL_STATE: AccountDeletionReviewState = { status: "idle" };

type ExecuteState =
  | { status: "idle" }
  | { status: "deleting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function DeleteAccountForm() {
  const router = useRouter();
  const [review, reviewAction, reviewing] = useActionState(
    reviewAccountDeletionAction,
    INITIAL_STATE,
  );
  const [confirmation, setConfirmation] = useState("");
  const [execution, setExecution] = useState<ExecuteState>({ status: "idle" });

  async function executeDeletion() {
    if (review.status !== "review" || !review.canDelete) return;

    setExecution({ status: "deleting" });
    try {
      const response = await fetch("/api/admin/account-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: review.email,
          userId: review.userId,
          confirmation,
        }),
      });
      const body = (await response.json()) as {
        deleted?: boolean;
        partial?: boolean;
        error?: string;
      };

      if (!response.ok || !body.deleted) {
        setExecution({
          status: "error",
          message:
            body.error ??
            "The account was not fully deleted. Review the account again before retrying.",
        });
        return;
      }

      setExecution({
        status: "success",
        message: `${review.email} was deleted from Oremea and Clerk. They can now register again from scratch.`,
      });
      setConfirmation("");
      router.refresh();
    } catch {
      setExecution({
        status: "error",
        message: "The deletion request could not be completed.",
      });
    }
  }

  return (
    <div className="rounded-[2rem] border border-red-500/25 bg-red-950/10 p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-red-300/70">
        Destructive
      </p>
      <h2 className="mt-2 text-xl font-light text-zinc-100">Delete account</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-500">
        Remove a test/old member from Oremea and Clerk so the same email can sign
        up as a new identity. Paid records and shared participant data block deletion.
      </p>

      <form
        action={reviewAction}
        onSubmit={() => {
          setConfirmation("");
          setExecution({ status: "idle" });
        }}
      >
        <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Member email
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm normal-case tracking-normal text-zinc-100 outline-none transition focus:border-red-400/60"
          />
        </label>
        <button
          type="submit"
          disabled={reviewing || execution.status === "deleting"}
          className="mt-6 w-full rounded-full border border-red-500/35 bg-red-500/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-red-200 transition hover:border-red-400/70 disabled:cursor-wait disabled:opacity-50"
        >
          {reviewing ? "Reviewing…" : "Review deletion"}
        </button>
      </form>

      {review.status === "error" ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-200">
          {review.message}
        </p>
      ) : null}

      {review.status === "review" ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
          <p className="text-xs font-medium text-zinc-200">{review.email}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-zinc-500">
            <span>Recognition</span>
            <span className="text-right">{review.summary.recognitionThreads}</span>
            <span>Compass</span>
            <span className="text-right">
              {review.summary.compassSessions + review.summary.compassGoals}
            </span>
            <span>Current</span>
            <span className="text-right">{review.summary.currentRecords}</span>
            <span>Resonance</span>
            <span className="text-right">{review.summary.resonanceRuns}</span>
            <span>Entitlements</span>
            <span className="text-right">{review.summary.entitlements}</span>
            <span>Golden Key</span>
            <span className="text-right">{review.summary.goldenKey ? "yes" : "no"}</span>
          </div>

          {review.blockers.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-100">
              <p className="font-medium">Deletion blocked</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {review.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-xs leading-5 text-red-200/80">
                This removes private product state, profile, access state, Golden Key
                issuance and the Clerk identity. This cannot be undone.
              </p>
              <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Type {review.confirmationText}
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-red-500/25 bg-black px-4 py-3 text-sm normal-case tracking-normal text-zinc-100 outline-none focus:border-red-400/70"
                />
              </label>
              <button
                type="button"
                onClick={executeDeletion}
                disabled={
                  execution.status === "deleting" ||
                  confirmation !== review.confirmationText
                }
                className="mt-4 w-full rounded-full border border-red-500/50 bg-red-600/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-600/25 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {execution.status === "deleting"
                  ? "Deleting…"
                  : "Delete account completely"}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {execution.status === "success" || execution.status === "error" ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-5 ${
            execution.status === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
              : "border-red-500/25 bg-red-500/10 text-red-200"
          }`}
        >
          {execution.message}
        </p>
      ) : null}
    </div>
  );
}
