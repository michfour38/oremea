import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";

export function CompassPromptFlow({
  title,
  description,
  value,
  placeholder,
  onChange,
  onSubmit,
  buttonLabel = "Continue",
}: {
  title: string;
  description?: string | null;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  buttonLabel?: string;
}) {
  return (
    <CompassCard title={title} description={description ?? ""}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Answer in your own words."}
        rows={7}
        className="compass-textarea"
      />

      <button onClick={onSubmit} className="primary-button">
        {buttonLabel}
      </button>
    </CompassCard>
  );
}