"use client";

import { useMemo, useState } from "react";
import { PARTY_TOPIC_GROUPS } from "./topics";

export function PartyTopicSurvey() {
  const [category, setCategory] = useState("");
  const [selection, setSelection] = useState("");
  const [other, setOther] = useState("");

  const group = useMemo(
    () => PARTY_TOPIC_GROUPS.find((item) => item.key === category) ?? null,
    [category],
  );

  const chooseCategory = (key: string) => {
    setCategory(key);
    setSelection("");
    setOther("");
  };

  const needsOther = selection === "Something else";

  return (
    <fieldset className="mt-7">
      <legend className="text-sm leading-6 text-zinc-200">
        Which area feels closest to what has your attention right now?
      </legend>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Choose the closest fit. There is no need to explain the whole story.
      </p>

      <div className="mt-4 grid gap-3">
        {PARTY_TOPIC_GROUPS.map((item) => {
          const selected = category === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => chooseCategory(item.key)}
              aria-pressed={selected}
              className={
                selected
                  ? "rounded-2xl border border-[#c8a96a]/60 bg-[#c8a96a]/10 px-4 py-4 text-left text-sm leading-6 text-[#f1dfb4]"
                  : "rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-left text-sm leading-6 text-zinc-300 transition hover:border-white/20 hover:text-white"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {group ? (
        <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm leading-6 text-zinc-200">{group.label}</p>
          <div className="mt-4 space-y-3">
            {[...group.options, "Something else"].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm leading-6 text-zinc-300 hover:border-white/20"
              >
                <input
                  type="radio"
                  name="topicSelection"
                  value={option}
                  checked={selection === option}
                  onChange={() => {
                    setSelection(option);
                    if (option !== "Something else") setOther("");
                  }}
                  required
                  className="mt-1"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          {needsOther ? (
            <label className="mt-5 block text-sm leading-6 text-zinc-200">
              Add the topic or question that fits better
              <textarea
                name="topicOther"
                value={other}
                onChange={(event) => setOther(event.target.value)}
                required
                maxLength={1000}
                rows={4}
                placeholder="A few words is enough."
                className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#c8a96a]/60"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <input type="hidden" name="topicCategory" value={category} />
    </fieldset>
  );
}
