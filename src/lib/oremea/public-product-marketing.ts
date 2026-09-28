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
      "Compass helps you clarify current reality, keep what matters visible on a working Map and leave with one movement you chose.",
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
    headline: "Belonging without losing yourself",
    buyerDecision:
      "Being welcomed is not the same as being able to remain yourself.",
    description:
      "Some connections let you settle in without much effort. In others, you can find yourself reading the room, editing what you say, carrying more of the exchange, or deciding how much of yourself can show up. The Hearth stays with that difference long enough for welcome, attention, space, boundaries and mutual effort to become easier to see.",
    chooseWhen:
      "Enter The Hearth when you want clearer evidence of what helps you move closer, what makes you hold back, and where connection leaves enough room for you to remain yourself. The room does not decide who belongs in your life; it helps you notice what connection is actually asking of you.",
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
    headline: "Different relationship. Familiar pattern.",
    buyerDecision:
      "When the same kind of interaction keeps showing up, seeing your part can change what is possible without making the whole thing yours to carry.",
    description:
      "The people can change while a familiar sequence keeps returning. You may find yourself smoothing, fixing, explaining, leading, waiting, withdrawing, or taking on more than was asked. Mirror slows the interaction down enough to separate what happened from the story that formed around it, what you did next and what followed. A pattern can become visible without becoming an identity.",
    chooseWhen:
      "Enter Mirror when a familiar dynamic keeps returning and you want to see what belongs to your participation—and what does not. It looks for the places where another move may actually be available without diagnosing you, inventing someone else’s motive, or making the whole dynamic yours to carry.",
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
    headline: "Care that can keep working",
    buyerDecision:
      "Care can be genuine and still leave one person carrying more than can be sustained.",
    description:
      "Care has a footprint in time, attention, labour, energy, resources and rest. Some support gives capacity back. Some helping quietly becomes expected. The Garden makes that movement visible so giving and receiving can be heard as lived arrangements rather than ideals about who cares more.",
    chooseWhen:
      "Enter The Garden when care is present but the way it moves needs clearer attention—what restores, what drains, what is being carried, what needs to be asked for, and what can actually be repeated. It does not score reciprocity or turn capacity and limits into a moral judgment.",
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
    headline: "Everything cannot come first",
    buyerDecision:
      "When several things genuinely matter, clarity comes from seeing what your real choices are already protecting, delaying or costing.",
    description:
      "Bearing puts stated priorities beside lived decisions: where time, attention and resources go, what gets less, what changes under pressure, and where words and actions stop pointing in the same direction. It makes current orientation visible without declaring a single choice to be your ‘true values’ or a verdict on your character.",
    chooseWhen:
      "Enter Bearing when important priorities are competing, a decision keeps wobbling, or your lived choices no longer seem to match what you say matters. It helps make the trade-offs and decision ownership visible without deciding what should win or turning clarity into an execution plan.",
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
    headline: "Let desire meet reality",
    buyerDecision:
      "Wanting something does not tell you what to do with it.",
    description:
      "Attraction can arrive faster than certainty. Pulse gives desire enough room for time, information and real contact to catch up—so what draws you in, what imagination adds, what changes with pace and what remains can be seen without turning the feeling into a verdict.",
    chooseWhen:
      "Enter Pulse when someone or something has your attention and you want to stay with the aliveness without rushing its meaning. Pulse does not decide compatibility, destiny, identity or hidden motive; it helps desire meet reality before choice.",
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
    headline: "When reaction arrives before choice",
    buyerDecision:
      "A strong reaction can make sense and still take over more of the moment than you want it to.",
    description:
      "Shadow slows a strong or familiar reaction down enough to see what changed, what the response helped with, what it cost, what is different now and where another choice may be available. It stays with the evidence you bring rather than explaining the reaction with a hidden wound or theory about your psyche.",
    chooseWhen:
      "Enter Shadow when a reaction feels stronger, faster or more familiar than you want it to be. The room helps you examine usefulness, cost and present choice without assuming trauma, defence, projection or a hidden cause.",
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

export function getOremeaMarketingProduct<Id extends OremeaProductTruthId>(
  id: Id,
) {
  return {
    ...OREMEA_PRODUCT_TRUTH[id],
    marketing: OREMEA_PUBLIC_PRODUCT_MARKETING[id],
  };
}
