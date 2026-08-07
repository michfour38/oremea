"use client";

import { useFormStatus } from "react-dom";

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export default function ContinueDayButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-w-[150px] rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#c8a96a] transition hover:bg-[#c8a96a]/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? <LoadingDots /> : "Continue to next day"}
    </button>
  );
}
