import type { ReactNode } from "react";

export function WorksBrand({
  href = "/works/za",
  context,
}: {
  href?: string;
  context?: string;
}) {
  return (
    <a href={href} className="inline-flex min-w-0 flex-col items-start" aria-label="WORKS by Oremea">
      <img
        src="/works/works-logo.png"
        alt="WORKS by Oremea"
        className="h-11 w-auto max-w-[210px] object-contain object-left"
      />
      {context ? <span className="mt-1 block text-[11px] text-black/40">{context}</span> : null}
    </a>
  );
}

export function WorksPageHeader({
  context,
  href,
  action,
}: {
  context?: string;
  href?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
      <WorksBrand href={href} context={context} />
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </header>
  );
}
