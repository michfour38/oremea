export const PARTY_TOPIC_GROUPS = [
  {
    key: "how_i_show_up",
    label: "What keeps repeating in how I show up?",
    options: [
      "I take on too much or carry the relationship",
      "I adapt myself to keep the connection",
      "I chase clarity, reassurance, or a response",
      "I withdraw, shut down, or become hard to reach",
      "I seem to end up in the same role with different people",
    ],
  },
  {
    key: "who_i_connect_with",
    label: "What keeps repeating in who I connect with?",
    options: [
      "I am drawn to people who are unavailable or inconsistent",
      "Intensity becomes closeness very quickly",
      "I end up rescuing, fixing, or being needed",
      "I feel unseen, overlooked, or not fully chosen",
      "The people change but the relationship dynamic feels familiar",
    ],
  },
  {
    key: "boundaries_and_trust",
    label: "What keeps repeating around boundaries and trust?",
    options: [
      "It is difficult to say no or hold a limit",
      "My boundaries are stated but do not seem to change what happens",
      "Trust is difficult even when I want closeness",
      "I protect myself by keeping distance or controlling access",
      "I am unsure what is reasonable to expect or permit",
    ],
  },
  {
    key: "conflict_and_repair",
    label: "What keeps repeating when there is conflict?",
    options: [
      "We keep having versions of the same argument",
      "Things escalate, become defensive, or get bigger than the issue",
      "One or both of us go quiet, avoid, or disconnect",
      "There are apologies or explanations but the pattern does not change",
      "I do not know what real repair would need to look like",
    ],
  },
  {
    key: "care_and_mutuality",
    label: "What keeps repeating around care, effort, and mutuality?",
    options: [
      "I carry more of the emotional or mental load",
      "I give more than I receive",
      "It is difficult to ask clearly for what I need",
      "I feel responsible for the other person's feelings or stability",
      "I am unsure what fair participation actually looks like",
    ],
  },
  {
    key: "change_and_choice",
    label: "What keeps repeating when I know something needs to change?",
    options: [
      "I can see the pattern and still find myself repeating it",
      "I feel stuck between staying and leaving",
      "I know what I do not want but not what I do want",
      "I do not fully trust my own reading of what is happening",
      "Changing the pattern feels like it may disappoint or hurt someone",
    ],
  },
] as const;

export type PartyTopicGroup = (typeof PARTY_TOPIC_GROUPS)[number];
export type PartyTopicKey = PartyTopicGroup["key"];

export function getPartyTopicGroup(key: string) {
  return PARTY_TOPIC_GROUPS.find((group) => group.key === key) ?? null;
}
