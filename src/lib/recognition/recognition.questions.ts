export type RecognitionQuestion = {
  key: string;
  text: string;
  support?: string;
};

export const RECOGNITION_QUESTIONS: RecognitionQuestion[] = [
  {
    key: "attention",
    text: "What has been taking up space in your attention lately?",
    support:
      "Write every thought that comes up as you read this. You can begin with \"I don't know what to write.\" Then keep going with whatever comes after it. A person, conversation, decision, responsibility, idea, possibility, something unfinished, something changing, or several things at once can all belong here.",
  },
  {
    key: "reality",
    text: "Looking at what you just wrote, what is actually happening around what you named right now?",
    support:
      "You can include what happened, who is involved, what has changed, what keeps needing your attention, and how the different parts connect.",
  },
  {
    key: "people",
    text: "Who is involved in what you have described, and what is each person actually doing or carrying?",
    support:
      "Stay close to what you can observe: actions, responsibilities, contributions, choices, conversations, and current circumstances.",
  },
  {
    key: "returning",
    text: "Looking back at what you have written so far, what appears more than once or keeps returning in different words?",
    support:
      "Read your earlier answers before responding. Notice repeated experiences, concerns, responsibilities, needs, or phrases.",
  },
  {
    key: "participation",
    text: "Where do you see yourself appearing repeatedly inside what you have described?",
    support:
      "Notice what you keep doing, carrying, choosing, providing, protecting, or attending to.",
  },
  {
    key: "weight",
    text: "Looking back at everything you've written, what matters most to you?",
    support:
      "Stay with whatever your attention goes to first. What makes that matter to you?",
  },
  {
    key: "distinction",
    text: "When you place your answers beside one another, what becomes easier to distinguish?",
    support:
      "Something may separate into clearer parts: what belongs to you, what belongs to someone else, what matters, what is required, what is available, or what has changed.",
  },
  {
    key: "clarity",
    text: "What do you already know clearly now?",
    support:
      "Use your own words. Let the clarity be as simple, specific, or unfinished as it genuinely is.",
  },
  {
    key: "clarity_holding",
    text: "Where does that clarity become harder to hold?",
    support:
      "Look at what happens when other people, expectations, emotions, responsibilities, or consequences enter the picture.",
  },
  {
    key: "recognition",
    text: "Read everything you have written from the beginning. What can you see now that was less visible when you started?",
    support:
      "Let your own explanations show you. Notice what becomes stark when the answers are placed together.",
  },
];