"use client";

interface AnalyzeFormProps {
  completionId: string;
  existingContent: string | null;
  onClose: () => void;
}

export default function AnalyzeForm({ onClose }: AnalyzeFormProps) {
  return (
    <div className="res-border res-panel mt-3 rounded-2xl border px-4 py-4">
      <p className="res-text-secondary text-xs leading-6">
        Shared analysis is no longer part of Resonance.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="res-text-secondary res-accent-hover mt-3 text-xs transition"
      >
        Close
      </button>
    </div>
  );
}
