"use client";

import { useFormStatus } from "react-dom";

export function VisitSubmitButton({ children, disabled = false }: {
  children: React.ReactNode; disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending}
      className="w-full rounded-xl border border-[#d5b56e]/75 px-5 py-3 text-base font-medium text-[#f0cf7a] transition hover:bg-[#c8a96a]/15 hover:text-[#ffe2a0] disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Please wait…" : children}
    </button>
  );
}
