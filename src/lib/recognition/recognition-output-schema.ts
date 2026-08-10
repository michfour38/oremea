export const RECOGNITION_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description:
        "Recognition's participant-facing reply. Direct, evidence-bound, concise, and no more than one question.",
    },
    remember: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: {
            type: "string",
            description:
              "A short character-for-character excerpt copied from a participant message in the supplied recent conversation.",
          },
          turnIndex: {
            type: "integer",
            description: "The exact participant turn containing the quoted excerpt.",
          },
          kind: {
            type: "string",
            enum: [
              "statement",
              "value",
              "choice",
              "clarity",
              "uncertainty",
              "responsibility",
              "boundary",
              "commitment",
              "correction",
            ],
          },
        },
        required: ["quote", "turnIndex", "kind"],
        additionalProperties: false,
      },
    },
  },
  required: ["reply", "remember"],
  additionalProperties: false,
};
