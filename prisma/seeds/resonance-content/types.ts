export type ResonancePromptSeed = {
  prompt_order: number;
  type: "thread_prompt" | "mirror_exercise";
  label: string | null;
  content: string;
};

export type ResonanceDaySeed = {
  day_number: number;
  prompts: readonly ResonancePromptSeed[];
};

export type ResonanceWeekSeed = {
  week_number: number;
  slug: string;
  title: string;
  theme: string;
  is_integration: boolean;
  days: readonly ResonanceDaySeed[];
};
