"use client";

interface AnalyzeFormProps {
  completionId: string;
  existingContent: string | null;
  onClose: () => void;
}

export default function AnalyzeForm({ onClose }: AnalyzeFormProps) {
  return (
    <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
      <p className="text-xs leading-6 text-zinc-500">
        Shared analysis is no longer part of Resonance.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 text-xs text-zinc-500 transition hover:text-zinc-300"
      >
        Close
      </button>
    </div>
  );
}
