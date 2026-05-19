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
      title="Let’s sit with this before we move."
      description="This is where Compass helps you find the smallest truthful next step."
    >
      <div className="space-y-5">
        {discussionMessages.map((message, index) => (
          <div key={`${message.role}-${index}`} className="text-sm leading-relaxed">
            <p
              className={
                message.role === "compass"
                  ? "mb-1 text-[#d8b15f]"
                  : "mb-1 text-zinc-200"
              }
            >
              {message.role === "compass" ? "Compass" : "You"}
            </p>

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
        placeholder="Reply here. If you feel blocked, say that. If you feel resistant, say that. If you feel ready, say that too."
        rows={6}
        className="compass-textarea"
      />

      <button onClick={onSend} className="primary-button">
        Send
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
      title="Do you feel able to execute this?"
      description="If this still feels too large, unclear, public, emotionally loaded, or difficult to begin, Compass will reduce the pressure further."
    >
      <textarea
        value={executionFeeling}
        onChange={(event) => onExecutionFeelingChange(event.target.value)}
        placeholder="Does this feel realistic, emotionally safe, sustainable, too large, too public, unclear, or difficult to begin?"
        rows={6}
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
      title="Your next executable step"
      description="One real movement. Not the entire transformation."
    >
      <div
        className={`rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5 text-sm leading-relaxed whitespace-pre-line ${BODY_TEXT}`}
      >
        {finalStep}
      </div>

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