import type { ResonanceWeekSeed } from "./types";

export const WEEK_2: ResonanceWeekSeed = {
  week_number: 2,
  slug: "mirror",
  title: "The Mirror",
  theme: "Patterns, roles, and relational self-awareness",
  is_integration: false,
  days: [
    {
      day_number: 1,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "In conversation, which role do you step into before anyone asks?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "What do you monitor most closely: the other person, the atmosphere, or your own expression?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "What do you do when an interaction unfolds differently from what you expected?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "What effect does your usual role have on what the other person can contribute?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Choose one recent interaction and describe only what you did, in sequence. What role becomes visible when the actions are placed beside one another?" },
      ],
    },
    {
      day_number: 2,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "What kind of relational moment tends to begin a familiar sequence for you?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "What do you usually do next?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "How does the other person commonly respond to that move?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "Where does the sequence tend to end?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Write one recurring sequence as: the moment that begins it → your move → their move → the result. Keep each part observable." },
      ],
    },
    {
      day_number: 3,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "What do you quickly decide an action means when someone disappoints you?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "Which facts are present before your interpretation enters?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "What evidence do you usually seek or overlook once you have formed a conclusion?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "How does your interpretation shape your next move?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Take one charged event and separate it into four lines: what happened, what you concluded, what you felt, and what you did." },
      ],
    },
    {
      day_number: 4,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "Which role appears across several of your relationships?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "What outcome does that role help you try to produce?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "What does the role make less available to you or to others?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "When did you recently act outside that familiar role?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Compare one interaction in which you used the familiar role with one in which you did something different. What changed in the exchange?" },
      ],
    },
    {
      day_number: 5,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "What part do you repeatedly contribute to a dynamic you dislike?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "Where is your intention different from your observable impact?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "What feedback about your participation is hardest to take in?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "What becomes possible when you include your contribution without taking responsibility for the whole dynamic?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Choose one recurring difficulty. Divide the page into: my contribution, their contribution, shared conditions, and what remains outside either person’s control." },
      ],
    },
    {
      day_number: 6,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "At which point in a recurring sequence do you have the most choice?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "What small different action would produce new information?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "What would you need to notice early enough to choose it?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "How would you know that the pattern had genuinely changed rather than paused?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Design one small relational experiment for the next time the pattern begins. Name the cue, the different action, and the evidence you will watch for." },
      ],
    },
    {
      day_number: 7,
      prompts: [
        { prompt_order: 1, type: "thread_prompt", label: null, content: "Which pattern became clearest to you this week?" },
        { prompt_order: 2, type: "thread_prompt", label: null, content: "What evidence supports it across more than one situation?" },
        { prompt_order: 3, type: "thread_prompt", label: null, content: "What does the pattern seem to achieve for you?" },
        { prompt_order: 4, type: "thread_prompt", label: null, content: "Which participation is now available instead?" },
        { prompt_order: 5, type: "mirror_exercise", label: null, content: "Write a precise pattern statement: When ___ happens, I tend to ___, which often produces ___. The next available movement is ___." },
      ],
    },
  ],
};
