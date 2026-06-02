import type { CompassDiscussionMessage } from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";

export function CompassDiscussionFlow({
  discussionMessages,
  discussionInput,
  onDiscussionInputChange,
  onSend,
  onReady,
}: {
  discussionMessages: CompassDiscussionMessage[];
  discussionInput: string;
  onDiscussionInputChange: (value: string) => void;
  onSend: () => void;
  onReady: () => void;
}) {
  return (
    <CompassCard
      title="What tends to interrupt movement?"
      description="Looking at everything you have written so far, what most often gets in the way?"
    >
      <div className="space-y-4">
        {discussionMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-[1.4rem] p-5 text-sm leading-relaxed ${
              message.role === "compass"
                ? "bg-[#12100D]"
                : "bg-[#121212] text-zinc-100"
            }`}
          >
            <p
              className={`whitespace-pre-line ${
                message.role === "compass" ? BODY_TEXT : "text-zinc-100"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </div>

      <textarea
        value={discussionInput}
        onChange={(event) => onDiscussionInputChange(event.target.value)}
        placeholder="Describe what most often interrupts movement. Be specific about what actually happens."
        rows={7}
        className="compass-textarea mt-5"
      />

      <button onClick={onSend} className="primary-button">
        Continue
      </button>

      <button onClick={onReady} className="secondary-button">
        I’m ready to choose the next step
      </button>
    </CompassCard>
  );
}

export function CompassExecutionCheck({
  executionFeeling,
  onExecutionFeelingChange,
  onFinalize,
}: {
  executionFeeling: string;
  onExecutionFeelingChange: (value: string) => void;
  onFinalize: () => void;
}) {
  return (
    <CompassCard
      title="Can this be acted on now?"
      description="If the next movement still feels too large, unclear, exposed, or difficult to begin, Compass will reduce the scale."
    >
      <textarea
        value={executionFeeling}
        onChange={(event) => onExecutionFeelingChange(event.target.value)}
        placeholder="Describe whether this feels realistic, clear, sustainable, too large, too public, or difficult to begin."
        rows={7}
        className="compass-textarea"
      />

      <button onClick={onFinalize} className="primary-button">
        Finalize next step
      </button>
    </CompassCard>
  );
}

export function CompassComplete({
  finalStep,
  resonanceReflection,
  resonanceCtaHref,
  resonanceCtaLabel,
}: {
  finalStep: string;
  resonanceReflection: string | null;
  resonanceCtaHref: string | null;
  resonanceCtaLabel: string | null;
}) {
  return (
    <CompassCard
      title="Your next completed action"
      description="One real movement. Not the entire transformation."
    >
      <div
        className={`rounded-[1.5rem] bg-[#121212] p-5 text-sm leading-relaxed whitespace-pre-line ${BODY_TEXT}`}
      >
        {finalStep}
      </div>

      {resonanceReflection && (
        <div className="rounded-[1.5rem] bg-[#121212] p-5">
          <p className={`whitespace-pre-line text-sm leading-relaxed ${BODY_TEXT}`}>
            {resonanceReflection}
          </p>

          <a
            href={resonanceCtaHref ?? "https://www.oremea.com/?open=resonance"}
            className="primary-button inline-flex items-center justify-center"
          >
            {resonanceCtaLabel ?? "Explore Resonance"}
          </a>
        </div>
      )}
    </CompassCard>
  );
}