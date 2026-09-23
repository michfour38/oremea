import Link from "next/link";

interface FeedbackIconProps {
  href?: string;
  active?: boolean;
}

export function FeedbackIcon({
  href = "/feedback",
  active = false,
}: FeedbackIconProps) {
  return (
    <Link
      href={href}
      aria-label="Feedback"
      title="Feedback"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-black/20 transition ${
        active
          ? "border-[#b79a63]/70 text-[#b79a63]"
          : "border-[#b79a63]/35 text-[#e7c98b] hover:border-[#b79a63]/70 hover:bg-[#b79a63]/[0.06]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px] fill-none stroke-current"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4.2-.9L3 21l1.6-4.1A8.1 8.1 0 0 1 3 12c0-4.7 4-8.5 9-8.5s9 3.6 9 8Z" />
        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
      </svg>
    </Link>
  );
}
