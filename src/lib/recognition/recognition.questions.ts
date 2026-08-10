export type RecognitionQuestion = {
  key: string;
  text: string;
  support?: string;
};

export type RecognitionAnswerContext = {
  questionKey: string;
  response: string;
};

export const RECOGNITION_QUESTIONS: RecognitionQuestion[] = [
  {
    key: "attention",
    text: "What has been taking up the most space in your attention lately?",
    support:
      "Write every thought that comes up as you read this. You can begin with ‘I don't know what to write’ and keep going with whatever comes after it. A person, conversation, decision, responsibility, idea, possibility, something unfinished, something changing, or several things at once can all belong here.",
  },
  {
    key: "reality",
    text: "Staying with what you just wrote, what is actually happening around it right now?",
    support:
      "Move from the headline into what is concrete. What happened, what is happening now, what keeps needing attention, or what feels difficult to name can all be useful evidence.",
  },
  {
    key: "people",
    text: "Who is directly involved, and what is each person actually doing or carrying?",
    support:
      "Stay close to what you can observe: actions, responsibilities, contributions, choices, conversations, and current circumstances.",
  },
  {
    key: "returning",
    text: "Across what you have written so far, what keeps appearing again?",
    support:
      "Look for repeated experiences, concerns, responsibilities, needs, people, phrases, or conditions. Name the recurrence before explaining it.",
  },
  {
    key: "participation",
    text: "Inside what keeps returning, where do you see yourself repeatedly participating?",
    support:
      "Notice what you keep doing, carrying, choosing, providing, protecting, attending to, allowing, declining, or returning to.",
  },
  {
    key: "weight",
    text: "Underneath what you just described, what matters most to you?",
    support:
      "Let importance come from your own answer rather than from what appears most often. What makes this matter to you?",
  },
  {
    key: "distinction",
    text: "With that in view, what can you separate into clearer parts now?",
    support:
      "You may be able to distinguish what belongs to you, what belongs to someone else, what matters, what is required, what is available, what is assumed, or what has changed.",
  },
  {
    key: "clarity",
    text: "What do you already know clearly now?",
    support:
      "Use your own words. Let the clarity be as simple, specific, partial, or unfinished as it genuinely is.",
  },
  {
    key: "clarity_holding",
    text: "What happens that makes that clarity harder to hold?",
    support:
      "Look at what changes when other people, expectations, emotions, responsibilities, consequences, time, or uncertainty enter the picture.",
  },
  {
    key: "recognition",
    text: "Read from the beginning. What can you see now that was less visible when you started?",
    support:
      "Let your own answers show you. Notice what becomes stark, newly distinguishable, or easier to name when the whole sequence sits together.",
  },
];

const UNCERTAINTY_ONLY = /^(?:i\s*(?:do not|don't|dont)\s*know|idk|not\s+sure|unsure|everything|nothing|no\s+idea|dunno|i\s+guess)\b/i;

function latestResponse(answersSoFar: RecognitionAnswerContext[]) {
  for (let index = answersSoFar.length - 1; index >= 0; index -= 1) {
    const response = answersSoFar[index]?.response?.trim();
    if (response) return response;
  }
  return "";
}

function hasOnlyUncertainty(response: string) {
  const compact = response.trim().replace(/\s+/g, " ");
  return compact.length < 80 && UNCERTAINTY_ONLY.test(compact);
}

export function getRecognitionQuestionText(
  questionKey: string,
  answersSoFar: RecognitionAnswerContext[],
) {
  const base = RECOGNITION_QUESTIONS.find((question) => question.key === questionKey);
  if (!base) return "";

  const previous = latestResponse(answersSoFar);
  const uncertain = hasOnlyUncertainty(previous);

  switch (questionKey) {
    case "reality":
      return uncertain
        ? "What is the first concrete thing you can point to inside that uncertainty right now?"
        : "Staying with what you just wrote, what is actually happening around it right now?";
    case "people":
      return uncertain
        ? "Who or what is closest to this, even if the picture is still unclear?"
        : "Who is directly involved in what you just described, and what is each person actually doing or carrying?";
    case "returning":
      return "Across the answers above, what keeps appearing again in different words?";
    case "participation":
      return uncertain
        ? "Even without a full explanation yet, what do you notice yourself doing or carrying here?"
        : "Inside what keeps returning, where do you see yourself repeatedly participating?";
    case "weight":
      return uncertain
        ? "Even if the situation is still hard to name, what matters to you inside it?"
        : "Underneath what you just described, what matters most to you?";
    case "distinction":
      return "When you place what matters beside what is happening, what becomes easier to separate into clearer parts?";
    case "clarity":
      return uncertain
        ? "What is the clearest thing you can say, even if the rest is still uncertain?"
        : "What do you already know clearly now?";
    case "clarity_holding":
      return "What happens in real life that makes that clarity harder to hold?";
    case "recognition":
      return "Read everything from the beginning. What can you see now that was less visible when you started?";
    default:
      return base.text;
  }
}
