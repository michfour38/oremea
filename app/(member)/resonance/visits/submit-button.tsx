"use client";

import { useFormStatus } from "react-dom";

export function VisitSubmitButton({ children, disabled = false }: {
  children: React.ReactNode; disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending}
      className="res-action w-full rounded-xl border px-5 py-3 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Please wait…" : children}
    </button>
  );
}
