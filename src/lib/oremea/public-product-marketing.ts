import {
  OREMEA_PRODUCT_TRUTH,
  type OremeaProductTruthId,
} from "@/src/lib/oremea/product-truth";

type PublicProductMarketing = {
  id: OremeaProductTruthId;
  category: string;
  headline: string;
  buyerDecision: string;
  description: string;
  chooseWhen: string;
  limits: readonly string[];
  public: boolean;
  weekNumber?: number;
};

export const OREMEA_PUBLIC_PRODUCT_MARKETING = {
  recognition: {
    id: "recognition",
    category: "Help me see myself",
    headline:
      "A private AI discussion journal for thoughts that need more than a journal page",
    buyerDecision:
      "I keep talking or writing, but I still cannot see what is happening.",
    description:
      "Recognition stays close to your own words and one live thread. It can notice distinctions, recurrence and unfinished thought without deciding what any of it means for you.",
    chooseWhen:
      "Choose Recognition when a thought needs somewhere private to continue.",
    limits: [
      "Not therapy, coaching or crisis support.",
      "No fixed prompt sequence, action plan or accountability loop.",
      "The intelligence can reflect evidence; meaning and choice remain yours.",
    ],
    public: true,
  },
  compass: {
    id: "compass",
    category: "Help me move",
    headline: "Turn what matters into clear direction",
    buyerDecision: "I understand more, but what do I actually do next?",
    description:
      "Compass helps you clarify current reality, keep what matters visible on a working Map and leave with one movement you chose. Its seven Why layers stay intact so the movement is grounded before planning begins.",
    chooseWhen:
      "Choose Compass when understanding is present and something now needs movement.",
    limits: [
      "Not a planner, coach or source of accountability.",
      "The participant remains the chooser and may stop without a required return.",
      "Archive, Map, access, commerce and completion remain part of the product.",
    ],
    public: true,
  },
  "resonance-hearth": {
    id: "resonance-hearth",
    category: "Resonance room 1",
    headline: "Begin with belonging",
    buyerDecision:
      "Where can safety, presence and belonging begin in connection?",
    description:
      "The Hearth helps you notice the concrete cues and participation that make belonging more or less available, without promising safety as an outcome.",
    chooseWhen:
      "Choose The Hearth when you want to stay with arrival, welcome, presence and belonging.",
    limits: [
      "No guaranteed emotional safety.",
      "No diagnosis of why belonging is difficult.",
      "No pressure to disclose more than you choose.",
    ],
    public: true,
    weekNumber: 1,
  },
  "resonance-mirror": {
    id: "resonance-mirror",
    category: "Resonance room 2",
    headline: "Notice what you bring",
    buyerDecision:
      "What do I repeatedly bring into relationships, and what tends to happen next?",
    description:
      "Mirror helps you observe recurring roles, responses and participation in relationships. It places your own evidence beside itself without declaring the hidden meaning.",
    chooseWhen:
      "Choose Mirror when a relational pattern is visible but still difficult to describe clearly.",
    limits: [
      "No personality label or diagnosis.",
      "No invented motive.",
      "No claim that recurrence proves one explanation.",
    ],
    public: true,
    weekNumber: 2,
  },
  "resonance-garden": {
    id: "resonance-garden",
    category: "Resonance room 3",
    headline: "Notice how care moves",
    buyerDecision:
      "What gives, costs, restores and circulates care in my relationships?",
    description:
      "Garden helps you examine care, capacity, nourishment and reciprocity through what is actually happening, including what can be sustained.",
    chooseWhen:
      "Choose Garden when care is present but its cost, flow or reciprocity needs clearer attention.",
    limits: [
      "No compatibility scoring.",
      "No proof that care should continue.",
      "No moral judgment about capacity or limits.",
    ],
    public: true,
    weekNumber: 3,
  },
  "resonance-bearing": {
    id: "resonance-bearing",
    category: "Resonance room 4",
    headline: "See what your choices reveal",
    buyerDecision:
      "What do my real choices, priorities and trade-offs show matters now?",
    description:
      "Bearing makes values and integrity visible through choices, allocations and trade-offs. It clarifies orientation without turning that orientation into an execution plan.",
    chooseWhen:
      "Choose Bearing when stated values and lived priorities need to be heard together.",
    limits: [
      "No moral ranking of values.",
      "No instruction about which value should win.",
      "No Compass-style plan or prescribed next action.",
    ],
    public: true,
    weekNumber: 4,
  },
  "resonance-pulse": {
    id: "resonance-pulse",
    category: "Resonance room 5",
    headline: "Stay with relational pull",
    buyerDecision:
      "What creates attraction, aliveness and movement in connection for me?",
    description:
      "Pulse helps you stay close to desire, attraction, aliveness and relational rhythm as you experience them, without converting feeling into a verdict.",
    chooseWhen:
      "Choose Pulse when pull, chemistry or aliveness is present and you want to observe it without rushing its meaning.",
    limits: [
      "No compatibility verdict.",
      "No destiny claim.",
      "No invented hidden motive behind attraction.",
    ],
    public: true,
    weekNumber: 5,
  },
  "resonance-shadow": {
    id: "resonance-shadow",
    category: "Resonance room 6",
    headline: "Meet what happens under pressure",
    buyerDecision:
      "What happens in my participation when reaction becomes stronger?",
    description:
      "Shadow helps you notice strong reactions and familiar moves under pressure using the evidence you bring, without turning them into a theory about your psyche.",
    chooseWhen:
      "Choose Shadow when a reaction feels larger, faster or more familiar than the moment alone explains.",
    limits: [
      "No assumed trauma, defence or hidden wound.",
      "No projection theory.",
      "No diagnosis of disowned parts.",
    ],
    public: true,
    weekNumber: 6,
  },
  "resonance-forge": {
    id: "resonance-forge",
    category: "Resonance room 7",
    headline: "Stay honest through rupture and repair",
    buyerDecision:
      "What happens in conflict, and what would repair need to change in participation?",
    description:
      "Forge stays with conflict, rupture, honesty and repair. It helps you examine what happened and what changed participation could require without inventing the other person's motives.",
    chooseWhen:
      "Choose Forge when conflict or rupture needs honest attention and repair is a question, not a promise.",
    limits: [
      "Not therapy or mediation.",
      "No forced reconciliation.",
      "No invented account of another person's intent.",
    ],
    public: true,
    weekNumber: 7,
  },
  "resonance-vision": {
    id: "resonance-vision",
    category: "Resonance room 8",
    headline: "Give the future a concrete shape",
    buyerDecision:
      "What kind of shared relationship life am I actually trying to design?",
    description:
      "Vision helps you make a possible shared life concrete through rhythms, responsibilities, decisions, resources and tests, so imagination can meet reality.",
    chooseWhen:
      "Choose Vision when a future together needs more detail than longing alone can provide.",
    limits: [
      "No manifestation promise.",
      "No prediction that a future will happen.",
      "No Compass-style execution plan.",
    ],
    public: true,
    weekNumber: 8,
  },
  "resonance-gathering": {
    id: "resonance-gathering",
    category: "Resonance room 9",
    headline: "Gather without forcing coherence",
    buyerDecision:
      "What belongs together in what I have noticed, and what should remain separate?",
    description:
      "Gathering lets different pieces be heard beside one another. It can test what genuinely connects while allowing unresolved or separate material to stay that way.",
    chooseWhen:
      "Choose Gathering when several relational experiences are present and you want to hear their relationship without forcing one story.",
    limits: [
      "No grand meaning imposed on the whole.",
      "No requirement that every piece connect.",
      "No dependency on completing another room first.",
    ],
    public: true,
    weekNumber: 9,
  },
  "resonance-becoming": {
    id: "resonance-becoming",
    category: "Resonance room 10",
    headline: "Let understanding become lived",
    buyerDecision:
      "What could this understanding become through repeatable, lived practice?",
    description:
      "Becoming stays with embodiment, repetition and lived continuation. It includes low-capacity versions and return after a lapse so practice does not become a moral test.",
    chooseWhen:
      "Choose Becoming when something understood is ready to be carried in a form you can actually live.",
    limits: [
      "No streak, surveillance or accountability theatre.",
      "No moral failure attached to a lapse.",
      "No requirement to return to the product.",
    ],
    public: true,
    weekNumber: 10,
  },
  "the-current": {
    id: "the-current",
    category: "Private invitation-only access",
    headline: "Stay with yourself while something new forms",
    buyerDecision:
      "How do I remain present to myself inside a newly forming one-to-one relationship?",
    description:
      "The Current is private self-witnessing inside one newly forming connection. It supports participation without becoming a judge of the relationship.",
    chooseWhen:
      "The Current is invitation-led through genuine Oremea participation and remains a separate choice.",
    limits: [
      "No matchmaking, ranking or compatibility score.",
      "No red-flag verdict or relationship authority.",
      "No pressure to remain in the product or the relationship.",
    ],
    public: false,
  },
} as const satisfies Record<OremeaProductTruthId, PublicProductMarketing>;

export const RESONANCE_ROOM_MARKETING = Object.values(
  OREMEA_PUBLIC_PRODUCT_MARKETING,
)
  .filter(
    (
      product,
    ): product is Extract<
      (typeof OREMEA_PUBLIC_PRODUCT_MARKETING)[OremeaProductTruthId],
      { weekNumber: number }
    > => "weekNumber" in product,
  )
  .sort((left, right) => left.weekNumber - right.weekNumber);

export function getOremeaMarketingProduct(id: OremeaProductTruthId) {
  return {
    ...OREMEA_PRODUCT_TRUTH[id],
    marketing: OREMEA_PUBLIC_PRODUCT_MARKETING[id],
  };
}
