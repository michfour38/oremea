"use client";

import { useState } from "react";
import AnalyzeForm from "./analyze-form";

type Status = "private" | "requested_public" | "public";

interface AnalyzeBoxProps {
  completionId: string;
  analysisId?: string | null;
  existingAnalysis?: string | null;
  status?: Status | null;
}

export default function AnalyzeBox({
  completionId,
  existingAnalysis,
}: AnalyzeBoxProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-zinc-600 transition hover:text-zinc-400"
        >
          Analysis retired
        </button>
      ) : (
        <AnalyzeForm
          completionId={completionId}
          existingContent={existingAnalysis ?? null}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
