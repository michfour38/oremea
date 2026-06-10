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
  title="Discussion"
  description="The questions are finished. From here, treat Compass like a conversation. Answer naturally. Add details when they matter. Correct Compass when it misunderstands you. Continue until you feel ready to choose your next step."
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
        placeholder="Reply naturally. Short answers are fine. Long answers are fine. Add context, disagree, correct Compass, or explain what actually happens."
        rows={7}
        className="compass-textarea mt-5"
      />

      <button onClick={onSend} className="primary-button">
        Continue discussion
      </button>

      <button onClick={onReady} className="secondary-button">
        Choose my next step
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
      title="Will this actually happen?"
      description="Before Compass closes, make the action small enough, clear enough, and honest enough to complete."
    >
      <textarea
        value={executionFeeling}
        onChange={(event) => onExecutionFeelingChange(event.target.value)}
        placeholder="Write the exact action you are willing to complete next. If the action still feels too large, vague, exposed, dependent on others, or unlikely to happen, reduce it until it becomes real."
        rows={7}
        className="compass-textarea"
      />

      <button onClick={onFinalize} className="primary-button">
        Finalize commitment
      </button>
    </CompassCard>
  );
}

export function CompassComplete({
  finalStep,
  resonanceReflection,
  resonanceCtaHref,
  resonanceCtaLabel,
  onComplete,
}: {
  finalStep: string;
  resonanceReflection: string | null;
  resonanceCtaHref: string | null;
  resonanceCtaLabel: string | null;
  onComplete: () => void;
}) {
  return (
    <CompassCard
      title="Your next completed action"
      description="One real movement. Not the entire transformation."
    >
      <div
        className={`rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5 text-sm leading-relaxed whitespace-pre-line text-zinc-300`}
      >
        {finalStep}
      </div>

<button onClick={onComplete} className="primary-button">
  Complete Compass
</button>

      {resonanceReflection && (
        <div className="rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5">
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