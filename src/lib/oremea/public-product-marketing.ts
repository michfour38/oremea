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
      "Care has a footprint in time, attention, labour, energy, resources and rest. Some support gives capacity back. Some help still leaves the work of noticing, explaining, reminding, checking or finishing with the person being helped. The Garden makes that movement visible so giving and receiving can be heard as lived arrangements rather than ideals about who cares more.",
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
      "Bearing puts stated priorities beside lived decisions: where time, attention and resources go, what gets less, what changes under pressure, whose expectations are shaping the choice, and where words and actions stop pointing in the same direction. It makes current orientation visible without declaring a single choice to be your ‘true values’ or a verdict on your character.",
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
      "Attraction can arrive faster than certainty. Pulse gives desire enough room for time, information and real contact to catch up—so what draws you in, what the body signals, what imagination adds, what context changes and what remains can be seen without turning intensity into a verdict.",
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
      "Shadow slows a strong or familiar reaction down enough to see what changed, what it seems to be responding to, what it helps with, what it costs, what information is actually available now and where another choice may be available. It stays with the evidence you bring rather than explaining the reaction with a hidden wound or theory about your psyche.",
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
    headline: "Repair has to become visible",
    buyerDecision:
      "An apology can matter. What changes afterward tells you whether repair is actually happening.",
    description:
      "Forge separates what happened, what followed, what belongs to each person and what kind of repair would actually match the problem. It keeps explanations, intentions and remorse from standing in for evidence, while leaving room for accountability without forced reconciliation.",
    chooseWhen:
      "Enter Forge when a conflict or rupture still needs honest attention and you want clearer ground for responsibility, repair and what happens if repair is not available. It does not invent the other person’s motives, manufacture remorse or mediate the relationship.",
    limits: [
      "Not therapy or mediation.",
      "No forced reconciliation.",
      "No invented account of another person’s intent.",
    ],
    public: true,
    weekNumber: 7,
  },
  "resonance-vision": {
    id: "resonance-vision",
    category: "Resonance room 8",
    headline: "Can the future survive an ordinary Tuesday?",
    buyerDecision:
      "Longing can tell you that you want a future. Design shows you what that future would actually ask of the people living it.",
    description:
      "Vision turns a possible shared life into ordinary days, rhythms, responsibilities, decisions, resources, backup plans and small tests. It makes assumptions concrete enough to examine before imagination is mistaken for an agreement or a workable system.",
    chooseWhen:
      "Enter Vision when ‘someday’ sounds good but the daily architecture is still blurry—or when people agree on the future in principle and need to discover whether they mean the same life in practice. Vision does not manifest, predict or promise an outcome.",
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
    headline: "Clarity without forcing one story",
    buyerDecision:
      "Sometimes the work is not finding one answer. It is seeing which pieces genuinely belong together—and which deserve to stay separate.",
    description:
      "Gathering gives different experiences, contradictions, recurring threads and unfinished material room to sit beside one another. It tests connection without manufacturing it, holds competing truths without flattening either one, and helps sort what to keep noticing, act on, support or leave alone for now.",
    chooseWhen:
      "Enter Gathering when you have many pieces and want a fuller picture without turning complexity into one grand explanation. The room does not impose meaning, require every piece to connect or depend on completing another Resonance room first.",
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
    headline: "Can it survive a bad day?",
    buyerDecision:
      "Insight changes less than a practice you can still return to when life is busy, energy is low or yesterday did not go to plan.",
    description:
      "Becoming turns one chosen understanding into visible, repeatable practice. It works with a recurring cue, realistic frequency, environmental support, a lower-capacity version, keepable agreements and return after a lapse—so continuation is designed for real life rather than perfect conditions.",
    chooseWhen:
      "Enter Becoming when you know what you mean but want to see it become something you actually live. The room helps make the practice small enough to continue and easy enough to resume without turning a missed day into a moral verdict or a reason to start over from zero.",
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
