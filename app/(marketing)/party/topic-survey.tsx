"use client";

import { useMemo, useState } from "react";
import { PARTY_TOPIC_GROUPS } from "./topics";

const OWN_VERSION = "Neither — my version is different";

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

  const needsOther = selection === OWN_VERSION;

  return (
    <fieldset className="mt-7">
      <legend className="text-sm leading-6 text-zinc-200">
        Choose the relationship topic you want to look at.
      </legend>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Then choose which side of the question feels closer. If neither does, write it in your own words.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <p className="font-serif text-xl leading-8 text-white">{group.question}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            This is not a diagnosis. It is simply a contrast to help make the ambiguity visible.
          </p>

          <div className="mt-5 space-y-3">
            {group.options.map((option, index) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 px-4 py-4 text-sm leading-6 text-zinc-300 hover:border-white/20"
              >
                <input
                  type="radio"
                  name="topicSelection"
                  value={option.label}
                  checked={selection === option.label}
                  onChange={() => {
                    setSelection(option.label);
                    setOther("");
                  }}
                  required
                  className="mt-1"
                />
                <span>
                  <span className="mr-2 text-[#c8a96a]">{index === 0 ? "A" : "B"}.</span>
                  {option.label}
                </span>
              </label>
            ))}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 px-4 py-4 text-sm leading-6 text-zinc-300 hover:border-white/20">
              <input
                type="radio"
                name="topicSelection"
                value={OWN_VERSION}
                checked={selection === OWN_VERSION}
                onChange={() => setSelection(OWN_VERSION)}
                required
                className="mt-1"
              />
              <span>
                <span className="mr-2 text-[#c8a96a]">C.</span>
                Neither — my version is different.
              </span>
            </label>
          </div>

          {needsOther ? (
            <label className="mt-5 block text-sm leading-6 text-zinc-200">
              Write your version of the question or contrast
              <textarea
                name="topicOther"
                value={other}
                onChange={(event) => setOther(event.target.value)}
                required
                maxLength={1000}
                rows={4}
                placeholder="What are the two possibilities you are actually weighing?"
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
