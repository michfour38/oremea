import assert from "node:assert/strict";

import {
  getRecognitionQuestionText,
} from "../src/lib/recognition/recognition.questions";

assert.equal(
  getRecognitionQuestionText("reality", [
    { questionKey: "attention", response: "IDK lol" },
  ]),
  "What is the first concrete thing you can point to inside that uncertainty right now?",
  "A vague first answer must not produce the old 'what you named' assumption.",
);

assert.equal(
  getRecognitionQuestionText("reality", [
    {
      questionKey: "attention",
      response: "Everything is on my plate: work, family, and a maintenance budget that keeps shrinking.",
    },
  ]),
  "Staying with what you just wrote, what is actually happening around it right now?",
  "A substantive first answer should move into observable reality.",
);

assert.equal(
  getRecognitionQuestionText("clarity", [
    { questionKey: "weight", response: "I am not sure yet." },
  ]),
  "What is the clearest thing you can say, even if the rest is still uncertain?",
  "Explicit uncertainty must still offer a usable route into clarity.",
);

console.log("Recognition question contract checks passed.");
