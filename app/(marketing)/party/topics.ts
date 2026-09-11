export const PARTY_TOPIC_GROUPS = [
  {
    key: "connection",
    label: "Connection",
    question: "When I keep reaching for connection, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "There is genuine mutual connection here, but it needs clearer communication or participation.",
      },
      {
        key: "b",
        label: "I may be working harder to resolve uncertainty than the other person is working to build connection.",
      },
    ],
  },
  {
    key: "attraction_and_choosing",
    label: "Attraction & choosing",
    question: "When I feel strongly drawn to someone, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "The intensity reflects real compatibility, reciprocity, and something worth building.",
      },
      {
        key: "b",
        label: "The intensity may feel compelling because something about it is familiar, even if mutuality is uncertain.",
      },
    ],
  },
  {
    key: "boundaries_and_trust",
    label: "Boundaries & trust",
    question: "When a boundary is difficult to hold, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "I know what my boundary is, but the other person's response makes it difficult to maintain.",
      },
      {
        key: "b",
        label: "I am still working out what I actually want, need, expect, or permit.",
      },
    ],
  },
  {
    key: "conflict_and_repair",
    label: "Conflict & repair",
    question: "When the same conflict keeps returning, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "The original issue has not actually been resolved.",
      },
      {
        key: "b",
        label: "The repeated argument may be carrying a deeper fear, need, expectation, or meaning that has not been named.",
      },
    ],
  },
  {
    key: "care_and_mutuality",
    label: "Care & mutuality",
    question: "When I do more in a relationship, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "That level of care is freely chosen, aligned, and still feels mutual.",
      },
      {
        key: "b",
        label: "I may be compensating for participation that is missing from the other side.",
      },
    ],
  },
  {
    key: "trusting_my_reading",
    label: "Trusting what I see",
    question: "When I question my own reading of what is happening, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "The evidence really is mixed, so uncertainty makes sense.",
      },
      {
        key: "b",
        label: "I may have learned to override what I notice in order to preserve the connection.",
      },
    ],
  },
  {
    key: "change_and_choice",
    label: "Change & choice",
    question: "When I stay in something I know needs to change, which possibility feels closer?",
    options: [
      {
        key: "a",
        label: "I can still see mutual participation, movement, and something real being built.",
      },
      {
        key: "b",
        label: "The cost of changing or leaving may feel harder than the cost of repeating what is familiar.",
      },
    ],
  },
] as const;

export type PartyTopicGroup = (typeof PARTY_TOPIC_GROUPS)[number];
export type PartyTopicKey = PartyTopicGroup["key"];

export function getPartyTopicGroup(key: string) {
  return PARTY_TOPIC_GROUPS.find((group) => group.key === key) ?? null;
}

export function getPartyTopicOption(group: PartyTopicGroup, value: string) {
  return group.options.find((option) => option.label === value) ?? null;
}
