"use client";

import { useFormStatus } from "react-dom";

export function VisitSubmitButton({ children, disabled = false }: {
  children: React.ReactNode; disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending}
      className="w-full rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-base text-[#e0c38b] transition hover:bg-[#c8a96a]/10 disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Please wait…" : children}
    </button>
  );
}
