import type { ReactNode } from "react";

export function CompassCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-[#0f0f0f]/96 p-6 shadow-2xl shadow-black/30 backdrop-blur">
      {eyebrow && (
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
          {eyebrow}
        </p>
      )}

      <h1 className="font-serif text-3xl text-[#d8b15f] sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400 sm:text-base">
        {description}
      </p>

      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}