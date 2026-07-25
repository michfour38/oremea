import { prisma } from "@/lib/prisma";
import { generateAI } from "@/src/lib/ai/ai-gateway";
import {
  buildRecognitionClarityMap,
  type RecognitionClarityContext,
  type RecognitionClarityMap,
} from "@/src/lib/recognition/recognition-clarity";
import {
  buildRecognitionEvidenceCalibrationMap,
  type RecognitionEvidenceCalibrationMap,
} from "@/src/lib/recognition/recognition-evidence-strength";
import {
  buildRecognitionMovementMap,
  type RecognitionMovementContext,
  type RecognitionMovementMap,
} from "@/src/lib/recognition/recognition-movement";
import {
  buildRecognitionParticipantSignalMap,
  type RecognitionParticipantSignalContext,
  type RecognitionParticipantSignalLink,
  type RecognitionParticipantSignalMap,
} from "@/src/lib/recognition/recognition-participant-signals";
import {
  buildRecognitionPerception,
  type RecognitionPerceptionSummary,
} from "@/src/lib/recognition/recognition-perception";
import {
  buildRecognitionRelationshipMap,
  type RecognitionRelationshipMap,
} from "@/src/lib/recognition/recognition-relationships";
import { RECOGNITION_QUESTIONS } from "@/src/lib/recognition/recognition.questions";

export type RecognitionType = "female" | "male" | "neutral";

export interface RecognitionOutputDTO {
  id: string;
  sessionId: string;
  output: string;
  questions: string[];
  themesDetected: string[];
  tensionsDetected: string[];
  createdAt: string;
}

export function getRecognitionQuestions(_entryType: RecognitionType) {
  return RECOGNITION_QUESTIONS;
}

type RecognitionPromptResponse = {
  questionKey: string;
  questionText: string;
  response: string;
};

function buildRecognitionPrompt(params: {
  firstName?: string | null;
  previousOutput?: string | null;
  regenerate?: boolean;
  responses: RecognitionPromptResponse[];
  perception: RecognitionPerceptionSummary;
  clarityMap: RecognitionClarityMap;
  participantSignals: RecognitionParticipantSignalMap;
  relationshipMap: RecognitionRelationshipMap;
  movementMap: RecognitionMovementMap;
  evidenceCalibration: RecognitionEvidenceCalibrationMap;
}) {
  const {
    firstName,
    previousOutput,
    regenerate,
    responses,
    perception,
    clarityMap,
    participantSignals,
    relationshipMap,
    movementMap,
    evidenceCalibration,
  } = params;

  return `
You are Oremea Recognition.

You reflect from the participant's entry reflection answers only.

First name: ${firstName || "Unknown"}

${
  regenerate && previousOutput
    ? `
This is a second Recognition pass.

The participant has had a chance to revisit their answers and offer more honest or precise information.
Use the previous Recognition as context while allowing the newer answers to carry stronger current evidence.
Notice what became clearer, more specific, or better supported.
Keep the language human and continuous with the first reflection.

PREVIOUS RECOGNITION:
${previousOutput}
`
    : ""
}

PURPOSE:

Recognition reveals what the participant's own words already make available to see.

EVIDENCE BOUNDARY:

Build every recognition from:
- the participant's actual answers
- specific language they used
- distinctions they made
- values, choices, clarity, uncertainty, or movement supported by their answers
- patterns supported across multiple answers
- relationships or dependencies the participant explicitly links in their own wording
- changes in articulation, distinction, specificity, or visibility that appear across the reflection sequence

Keep every observation proportionate to the available evidence.
Present interpretation as possibility when certainty is limited.
Preserve the participant's authority over their own meaning, identity, and choices.

A repeated or conservatively normalized term is a recurrence signal before it is a theme.
A repeated EL observation category is evidence structure before it is meaning.
A supported tension is a detectable pull rather than a complete account of everything present.
A relationship marker identifies a connection the participant wrote; the full sentence determines what kind of connection they are describing.
A continuing reflection thread identifies a subject that remains present from earlier to later stages; its significance comes from the participant's full contexts.
Cross-answer signals strengthen a recognition only when the surrounding answers support the same reading.

EVIDENCE STRENGTH AND DEPTH PRINCIPLES:

Evidence strength regulates how far Recognition may connect what it sees.
A single mechanical signal remains at opening-only depth. It can support a cautious possibility or a precise opening for further noticing.
A direct participant statement may be reflected plainly within the domain the question asked about.
Participant-stated importance has authority about what matters most to them. Participant-stated clarity has authority about what they say they know clearly. Participant-stated distinction has authority about what they can now separate. Final recognition has authority about what they say became newly visible.
A repeated subject across separate answers supports connected reflection when the raw contexts carry the same thread.
Several independent support forms can make a subject a central reflection candidate when the raw contexts cohere.
Convergence increases permission to connect evidence across the reflection. It does not convert interpretation into fact or create authority over identity, motive, diagnosis, causation, or future action.
Mechanical frequency never outranks a participant-owned direct statement inside that statement's domain.
A central reflection candidate may anchor a section when the participant's raw contexts support a coherent recognition. It remains a candidate rather than a required conclusion.

LANGUAGE TOLERANCE PRINCIPLES:

The participant's original wording remains the authoritative language of the reflection.
Detection may use a conservative normalized copy to connect obvious spelling variants, missing or extra letters, adjacent transpositions, and protected structural vocabulary.
Normalization supports detection while preserving the participant's prose.
Use raw participant sentences when describing or quoting what they wrote.
A normalized recurrence remains a support signal; read the raw contexts before assigning significance or meaning.

CLARITY PRINCIPLES:

The Recognition sequence itself provides participant-owned clarity data.
The answer to "What do you already know clearly now?" is the primary source for stated clarity.
The answer to "Where does that clarity become harder to hold?" describes conditions around holding clarity.
Those conditions can affect steadiness, expression, embodiment, or participation while the underlying clarity remains present.
Preserve stated clarity when consequences, expectations, emotions, responsibilities, or other people also appear.
The answer to the distinction question shows what the participant can already separate into clearer parts.
The final recognition answer shows what became newly visible through the reflection.
Explicit uncertainty is present only where the participant's own language states uncertainty.
Clarity and uncertainty can both be present in different parts of the same reality.

PARTICIPANT SIGNAL PRINCIPLES:

The Recognition sequence also provides participant-owned signals for attention, recurrence, participation, and weight.
The attention answer identifies what has been occupying attention. Importance, agreement, responsibility, and value remain separate signals unless the participant links them.
The returning answer records what the participant themselves notices recurring across what they wrote.
The participation answer records where the participant sees themselves repeatedly appearing inside the situation. Treat this descriptively. It may reflect care, labour, protection, contribution, choice, attention, habit, responsibility, or another role supported by their words.
The weight answer is the primary source for what the participant says matters most. Give this answer priority over mechanical recurrence when describing importance.
Spelling-tolerant recurrence across answers can strengthen convergence. Participant-stated importance remains primary when describing what matters most.
A subject may hold attention while another matters most, matter deeply with little repetition, and involve the participant while responsibility remains limited to what they themselves name.
Preserve all of these distinctions when more than one is true at the same time.

RELATIONSHIP AND DEPENDENCY PRINCIPLES:

Relationship signals come from explicit linking language inside the participant's own sentences.
Treat "when" and "if" as timing or condition unless the participant also supplies explicit causal language.
Treat "every time", "each time", and "whenever" as repeated conditions described by the participant.
Treat "because" and "due to" as the participant's stated explanation. Reflect ownership of that explanation rather than presenting it as externally established fact.
Treat "depends on", "dependent on", and "relies on" as participant-stated dependency.
Treat "as a result", "therefore", "which means", and "meaning that" as participant-stated consequence or inference.
A recurring subject linked in relationship statements across separate answers can strengthen recognition of a structure that keeps appearing.
The connection itself, its meaning, and any causal claim remain distinct. Preserve each at the level the participant's wording supports.
Several relationships can be active around the same subject at once.

REFLECTION MOVEMENT PRINCIPLES:

Movement here describes how the participant's seeing changes while they write.
Treat the question order as a reflection sequence rather than a developmental ranking.
Initial attention shows what entered the reflection first.
Reality and people answers add observable context around what was initially named.
The returning answer shows recurrence the participant themselves has noticed.
The participation answer shows where they locate themselves inside what they described.
The weight answer shows what they say matters most at that point in the reflection.
The distinction answer is the participant's own statement about what has separated into clearer parts.
The clarity answer is the participant's own statement about what they know clearly now.
The clarity-holding answer shows conditions surrounding that clarity.
The final recognition answer is the strongest direct source for what became more visible through the sequence.
A continuing thread means the same conservatively detected subject appears in both early and later stages. Continuity alone establishes presence across the reflection; the raw contexts show whether its meaning, specificity, or relationship changed.
Movement can include greater specificity, a newly available distinction, an explicit clarification, a changed relationship to the same subject, or recognition of something that was previously less visible.
Several subjects can move differently within the same reflection.
Describe only movement supported by the participant's words. Keep readiness, healing, progress, and future action as separate questions unless the participant explicitly names them.

VOICE:

- grounded
- precise
- human
- emotionally accurate
- restrained
- direct
- evidence-led
- spacious
- respectful of sovereignty

CORE RELATIONSHIP:

Write as though the participant has been genuinely heard.
Reflect what their words make visible while leaving ownership of meaning with them.

WHAT TO NOTICE:

- what the participant names directly
- what has been taking up their attention
- what they themselves identify as returning
- where they see themselves repeatedly participating
- what they explicitly say matters most
- where those signals converge and where they remain distinct
- what becomes more specific across their answers
- what they explicitly state as clear
- what they distinguish into clearer parts
- what conditions affect their ability to remain with that clarity
- what remains explicitly uncertain in their own language
- what becomes newly visible when their answers are considered together
- where the participant explicitly links one condition, event, choice, or consequence to another
- where the same linked subject appears across separate answers
- where language recurs across separate answers, including conservatively normalized spelling variants
- where evidence categories recur across separate answers
- where a recurring subject carries a coherent thread across several answers
- where a subject remains present from early attention or reality into later distinction, clarity, or recognition
- where the participant's description of the same subject becomes more specific or differently framed across the sequence
- where a subject carries agency and friction in different answers
- where several truths, values, needs, choices, consequences, or constraints are present at the same time
- which observations are single signals, direct participant statements, supported patterns, or converging structures
- how much reflective depth the evidence calibration permits for each subject

STRUCTURE:

Use these exact quiet plain-text section labels:

What is becoming visible

What seems to matter

Where clarity already exists

What remains available to notice

SECTION RULES:

"What is becoming visible"
- Begin with the clearest recognition supported by the participant's answers.
- Ground it in specific evidence from their own words.
- Use proportionate language.
- Use the evidence calibration to regulate depth: opening-only signals stay brief; supported patterns may connect contexts; converging structures may anchor the section when the raw contexts cohere.
- Let cross-answer recurrence strengthen a recognition when the surrounding answers support the same reading.
- Let participant-stated relationships reveal structure when the wording clearly links conditions, explanations, dependencies, or consequences.
- Keep temporal or conditional links distinct from causal claims.
- Use the reflection movement map when it shows how an early subject becomes more specific, separated, clarified, or newly visible later in the sequence.
- A continuing thread establishes continuity across stages; describe a change in that thread only when the raw contexts support the change.
- A supported tension may be named when the relevant truths are clearly present in the participant's own words.
- Treat newly visible material as emerging recognition rather than a fixed identity claim.
- Participation may reveal where the participant repeatedly appears inside the situation while responsibility stays limited to what they actually name.

"What seems to matter"
- Begin with what the participant explicitly says matters most when that answer is available.
- Use attention and returning as additional participant-owned signals rather than substitutes for stated importance.
- Mechanical recurrence may strengthen context while participant-stated importance retains authority over what matters most.
- A supported theme candidate can strengthen this section when its separate contexts form a coherent thread.
- Distinguish sustained attention from stated importance when the answers make that distinction available.
- Name a value or concern only when the answers support it.
- Keep ownership with the participant.

"Where clarity already exists"
- Begin with participant-stated clarity and distinctions when they are available.
- Treat existing clarity as capacity.
- Preserve clarity even when the clarity-holding answer names difficult conditions around it.
- Use final recognition as additional evidence of what the participant can now see when it aligns with their stated clarity.
- Direct participant clarity outranks mechanically inferred confidence about the same subject.
- More than one truth can sit beside the clarity without cancelling it.
- Keep clarity distinct from instruction.

"What remains available to notice"
- Use explicit uncertainty, newly visible material, unresolved complexity, a supported tension, a participant-stated relationship, a continuing reflection thread, a single opening-only signal, or a meaningful distinction among attention, recurrence, participation, and importance as an opening when the evidence supports it.
- Leave one precise opening for further recognition.
- Keep the opening voluntary and grounded in what is already present.

MULTIPLE-TRUTH, TENSION, AND CONTRADICTION RULES:

More than one thing can be true at the same time.
A tension may contain several simultaneous truths, values, needs, choices, consequences, or constraints.
Preserve the full set that the participant's answers support rather than reducing the tension to two sides.
An agency/friction candidate below identifies one detectable pull around a subject; it is not the complete shape of that subject.
Use language such as "several things appear to be present at once" or "there appears to be a pull around..." when the evidence supports it.
Reserve the word contradiction for explicit participant statements that cannot reasonably both be true in the same sense at the same time.

EVIDENCE STRENGTH AND DEPTH MAP:

${renderEvidenceCalibrationMap(evidenceCalibration)}

REFLECTION MOVEMENT MAP:

${renderMovementMap(movementMap)}

PARTICIPANT-STATED RELATIONSHIP MAP:

${renderRelationshipMap(relationshipMap)}

PARTICIPANT-OWNED SIGNAL MAP:

${renderParticipantSignalMap(participantSignals)}

PARTICIPANT-OWNED CLARITY MAP:

${renderClarityMap(clarityMap)}

SUPPORTED THEME CANDIDATES:

These candidates are mechanically grounded in recurring language across at least three separate answers after conservative spelling-tolerant detection.
The recurrence threshold establishes sustained attention, not meaning by itself.
A candidate becomes useful as a theme only when its raw answer contexts carry a coherent thread.
Names, ordinary connective language, or repeated circumstance words can remain simple recurrence rather than becoming themes.

${renderSupportedThemes(perception)}

SUPPORTED CROSS-ANSWER TENSIONS:

These candidates are mechanically grounded where the same recurring subject appears inside agency evidence in one answer and objection evidence in another answer after conservative detection normalization.
Each candidate establishes one supported pull around that subject.
The participant's other answers may contain additional truths around the same subject and remain part of the recognition.

${renderSupportedTensions(perception)}

CROSS-ANSWER RECURRING LANGUAGE:

These terms recur across more than one answer after conservative spelling-tolerant detection.
Treat them as recurrence signals and read their raw contexts before assigning significance.

${renderRecurringLanguage(perception)}

CROSS-ANSWER EL OBSERVATIONS:

These EL categories recur across more than one answer.
They describe evidence structure rather than identity, motive, diagnosis, or meaning.

${renderRecurringObservations(perception)}

EL EVIDENCE BY ANSWER:

This evidence was extracted mechanically from the detection copy of participant answers.
Use it as supporting structure. The raw participant answers remain authoritative for wording and meaning.

${renderEvidenceByAnswer(perception)}

EL SUPPORTING OBSERVATIONS BY ANSWER:

These observations are derived from the evidence above and provide supporting structure.
The participant's own words remain authoritative.

${renderObservationsByAnswer(perception)}

USER RESPONSES:

${renderResponses(responses)}
`;
}

function renderEvidenceCalibrationMap(
  map: RecognitionEvidenceCalibrationMap,
): string {
  const directAuthorities =
    map.directAuthorities.length > 0
      ? map.directAuthorities
          .map(
            (item) =>
              `- [${item.questionKey}] ${item.domain}: ${item.level} → ${item.reflectionDepth}: ${item.content}`,
          )
          .join("\n")
      : "- No participant-owned direct authority response is available.";

  const subjectCalibrations =
    map.subjectCalibrations.length > 0
      ? map.subjectCalibrations
          .map(
            (item) => `
Subject "${item.term}": ${item.level} → ${item.reflectionDepth}
- answers: ${item.answerCount} (${item.questionKeys.join(", ")})
- support forms: ${item.supportForms.join(", ")}
- basis: ${item.basis}
${item.rawContexts
  .map((context) => `- [${context.questionKey}] ${context.content}`)
  .join("\n")}`,
          )
          .join("\n")
      : "- No cross-answer subject reached supported-pattern depth.";

  return `
Single mechanical signal baseline:
- ${map.singleSignalPolicy.level} → ${map.singleSignalPolicy.reflectionDepth}

Participant-owned direct statements:
${directAuthorities}

Cross-answer subject calibration:
${subjectCalibrations}
`;
}

function renderMovementMap(map: RecognitionMovementMap): string {
  const continuingThreads =
    map.continuingThreads.length > 0
      ? map.continuingThreads
          .map(
            (thread) => `
Continuing subject "${thread.term}" from ${thread.firstQuestionKey} to ${thread.lastQuestionKey}:
${thread.contexts
  .map((context) => `- [${context.questionKey}] ${context.content}`)
  .join("\n")}`,
          )
          .join("\n")
      : "- No qualifying subject spans both early and later reflection stages.";

  return `
Initial attention:
${renderMovementContexts(map.initialAttention)}

Grounded reality and people:
${renderMovementContexts(map.groundedReality)}

Participant-noticed recurrence:
${renderMovementContexts(map.participantNoticedRecurrence)}

Self-observed participation:
${renderMovementContexts(map.selfParticipation)}

Participant-stated importance:
${renderMovementContexts(map.statedWeight)}

Distinctions that became available:
${renderMovementContexts(map.distinctions)}

Participant-stated clarity:
${renderMovementContexts(map.statedClarity)}

Conditions around holding clarity:
${renderMovementContexts(map.clarityConditions)}

Final recognition — what became more visible:
${renderMovementContexts(map.finalRecognition)}

Continuing subjects across the reflection:
${continuingThreads}
`;
}

function renderMovementContexts(contexts: RecognitionMovementContext[]): string {
  if (contexts.length === 0) return "- No response available for this stage.";

  return contexts
    .map((context) => {
      const evidenceLabel =
        context.evidenceTypes.length > 0
          ? ` [EL: ${context.evidenceTypes.join(", ")}]`
          : "";

      return `- [${context.questionKey}]${evidenceLabel} ${context.content}`;
    })
    .join("\n");
}

function renderRelationshipMap(map: RecognitionRelationshipMap): string {
  const signals =
    map.signals.length > 0
      ? map.signals
          .map((signal) => {
            const evidenceLabel =
              signal.evidenceTypes.length > 0
                ? ` [EL: ${signal.evidenceTypes.join(", ")}]`
                : "";

            return `- [${signal.questionKey}] ${signal.kind} via "${signal.marker}"${evidenceLabel}: ${signal.content}`;
          })
          .join("\n")
      : "- No explicit relationship marker detected in the participant's wording.";

  const linkedSubjects =
    map.linkedRecurringSubjects.length > 0
      ? map.linkedRecurringSubjects
          .map(
            (item) => `
Recurring linked subject "${item.term}" across ${item.questionKeys.length} answers:
- relationship kinds: ${item.relationshipKinds.join(", ")}
- question keys: ${item.questionKeys.join(", ")}
${item.contexts.map((context) => `- ${context}`).join("\n")}`,
          )
          .join("\n")
      : "- No recurring subject appears inside relationship statements across multiple answers.";

  return `
Explicit participant-stated connections:
${signals}

Recurring subjects inside participant-stated connections:
${linkedSubjects}
`;
}

function renderParticipantSignalMap(
  signals: RecognitionParticipantSignalMap,
): string {
  return `
Initial attention:
${renderParticipantSignalContexts(
  signals.attention,
  "The participant provided no separate attention response.",
)}

What the participant identifies as returning:
${renderParticipantSignalContexts(
  signals.returning,
  "The participant provided no separate returning response.",
)}

Where the participant sees their own participation:
${renderParticipantSignalContexts(
  signals.participation,
  "The participant provided no separate participation response.",
)}

What the participant says matters most:
${renderParticipantSignalContexts(
  signals.weight,
  "The participant provided no separate importance response.",
)}

Cross-answer recurrence linked to attention:
${renderParticipantSignalLinks(signals.attentionAcrossAnswers)}

Cross-answer recurrence linked to the participant's returning answer:
${renderParticipantSignalLinks(signals.returningAcrossAnswers)}

Cross-answer recurrence linked to participation:
${renderParticipantSignalLinks(signals.participationAcrossAnswers)}

Cross-answer recurrence linked to participant-stated importance:
${renderParticipantSignalLinks(signals.weightAcrossAnswers)}

Supported theme candidates that also appear in the importance answer:
${
  signals.weightedThemes.length > 0
    ? signals.weightedThemes
        .map(
          (theme) =>
            `- "${theme.term}" appears across ${theme.answerCount} answers: ${theme.questionKeys.join(", ")}`,
        )
        .join("\n")
    : "- No supported theme candidate overlaps the importance answer."
}
`;
}

function renderParticipantSignalContexts(
  contexts: RecognitionParticipantSignalContext[],
  emptyMessage: string,
): string {
  if (contexts.length === 0) return `- ${emptyMessage}`;

  return contexts
    .map((context) => {
      const evidenceLabel =
        context.evidenceTypes.length > 0
          ? ` [EL: ${context.evidenceTypes.join(", ")}]`
          : "";

      return `- [${context.questionKey}]${evidenceLabel} ${context.content}`;
    })
    .join("\n");
}

function renderParticipantSignalLinks(
  links: RecognitionParticipantSignalLink[],
): string {
  if (links.length === 0) {
    return "- No qualifying cross-answer recurrence linked to this response.";
  }

  return links
    .map(
      (link) =>
        `- "${link.term}" also appears in: ${link.otherQuestionKeys.join(", ")} (${link.answerCount} answers total)`,
    )
    .join("\n");
}

function renderClarityMap(clarityMap: RecognitionClarityMap) {
  const statedClarity = renderClarityContexts(
    clarityMap.statedClarity,
    "Participant-stated clarity is still forming or was expressed with explicit uncertainty.",
  );
  const distinctions = renderClarityContexts(
    clarityMap.distinctions,
    "The participant provided no separate distinction response.",
  );
  const clarityConditions = renderClarityContexts(
    clarityMap.clarityConditions,
    "The participant named no separate conditions around holding clarity.",
  );
  const newlyVisible = renderClarityContexts(
    clarityMap.newlyVisible,
    "The participant provided no separate newly-visible response.",
  );
  const explicitUncertainty =
    clarityMap.explicitUncertainty.length > 0
      ? clarityMap.explicitUncertainty
          .map(
            (item) =>
              `- [${item.questionKey}] ${item.content} [markers: ${item.markers.join(", ")}]`,
          )
          .join("\n")
      : "- No explicit uncertainty language detected.";
  const clarityAlongsideTension =
    clarityMap.clarityAlongsideTension.length > 0
      ? clarityMap.clarityAlongsideTension
          .map(
            (item) => `
- Supported pull around "${item.term}" also appears inside clarity-related material:
${item.contexts
  .map((context) => `  - [${context.questionKey}] ${context.content}`)
  .join("\n")}`,
          )
          .join("\n")
      : "- No supported tension term overlaps the clarity-related answers.";

  return `
Stated clarity:
${statedClarity}

Distinctions already available:
${distinctions}

Conditions around holding clarity:
${clarityConditions}

Newly visible through the reflection:
${newlyVisible}

Explicit uncertainty:
${explicitUncertainty}

Clarity alongside supported complexity:
${clarityAlongsideTension}
`;
}

function renderClarityContexts(
  contexts: RecognitionClarityContext[],
  emptyMessage: string,
) {
  if (contexts.length === 0) return `- ${emptyMessage}`;

  return contexts
    .map((context) => {
      const evidenceLabel =
        context.evidenceTypes.length > 0
          ? ` [EL: ${context.evidenceTypes.join(", ")}]`
          : "";

      return `- [${context.questionKey}]${evidenceLabel} ${context.content}`;
    })
    .join("\n");
}

function renderSupportedThemes(perception: RecognitionPerceptionSummary) {
  if (perception.supportedThemes.length === 0) {
    return "- No supported theme candidate reached the recurrence threshold.";
  }

  return perception.supportedThemes
    .map(
      (theme) => `
Possible theme around "${theme.term}" across ${theme.answerCount} answers:
${theme.contexts
  .map((context) => {
    const evidenceLabel =
      context.evidenceTypes.length > 0
        ? ` [EL: ${context.evidenceTypes.join(", ")}]`
        : "";

    return `- [${context.questionKey}]${evidenceLabel} ${context.content}`;
  })
  .join("\n")}
`,
    )
    .join("\n");
}

function renderSupportedTensions(perception: RecognitionPerceptionSummary) {
  if (perception.supportedTensions.length === 0) {
    return "- No supported cross-answer tension detected.";
  }

  return perception.supportedTensions
    .map(
      (item) => `
Possible pull around "${item.term}":
Agency evidence:
${item.agencyEvidence
  .map(
    (evidence) =>
      `- [${evidence.questionKey}] ${evidence.type}: ${evidence.content}`,
  )
  .join("\n")}
Friction evidence:
${item.frictionEvidence
  .map(
    (evidence) =>
      `- [${evidence.questionKey}] ${evidence.type}: ${evidence.content}`,
  )
  .join("\n")}
`,
    )
    .join("\n");
}

function renderRecurringLanguage(perception: RecognitionPerceptionSummary) {
  if (perception.recurringLanguage.length === 0) {
    return "- No qualifying cross-answer recurrence detected.";
  }

  return perception.recurringLanguage
    .map(
      (item) =>
        `- "${item.term}" appears across ${item.answerCount} answers: ${item.questionKeys.join(", ")}`,
    )
    .join("\n");
}

function renderRecurringObservations(perception: RecognitionPerceptionSummary) {
  if (perception.recurringObservations.length === 0) {
    return "- No recurring EL observation categories detected.";
  }

  return perception.recurringObservations
    .map(
      (item) =>
        `- ${item.type} appears across ${item.answerCount} answers: ${item.questionKeys.join(", ")}`,
    )
    .join("\n");
}

function renderEvidenceByAnswer(perception: RecognitionPerceptionSummary) {
  return perception.answers
    .map((answer, index) => {
      const evidence =
        answer.perception.evidence.length > 0
          ? answer.perception.evidence
              .map(
                (item) =>
                  `- ${item.type}: ${item.content} (${item.confidence})`,
              )
              .join("\n")
          : "- No EL evidence extracted.";

      return `Answer ${index + 1} [${answer.questionKey}] evidence:\n${evidence}`;
    })
    .join("\n\n");
}

function renderObservationsByAnswer(perception: RecognitionPerceptionSummary) {
  return perception.answers
    .map((answer, index) => {
      const observations =
        answer.perception.observations.length > 0
          ? answer.perception.observations
              .map(
                (item) =>
                  `- ${item.type}: ${item.summary} (${item.confidence})`,
              )
              .join("\n")
          : "- No EL observations created.";

      return `Answer ${index + 1} [${answer.questionKey}] observations:\n${observations}`;
    })
    .join("\n\n");
}

function renderResponses(responses: RecognitionPromptResponse[]) {
  return responses
    .map(
      (item, index) =>
        `Question ${index + 1} [${item.questionKey}]: ${item.questionText}\nAnswer ${index + 1}: ${item.response}`,
    )
    .join("\n\n");
}

function extractQuestionsFromOutput(output: string) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith("?"))
    .slice(-2);
}

export async function generateRecognition(params: {
  sessionId: string;
  regenerate?: boolean;
}): Promise<RecognitionOutputDTO | null> {
  const session = await prisma.entry_mirror_sessions.findUnique({
    where: { id: params.sessionId },
    select: {
      id: true,
      entry_type: true,
      lead_id: true,
      entry_leads: {
        select: {
          first_name: true,
          email: true,
        },
      },
      entry_mirror_responses: {
        orderBy: { response_order: "asc" },
        select: {
          question_key: true,
          question_text: true,
          response: true,
        },
      },
      entry_mirror_outputs: {
        orderBy: { created_at: "asc" },
        take: 2,
        select: {
          id: true,
          session_id: true,
          output: true,
          questions: true,
          themes_detected: true,
          tensions_detected: true,
          created_at: true,
        },
      },
    },
  });

  if (!session) return null;

  const outputs = session.entry_mirror_outputs;
  const latest = outputs[outputs.length - 1] ?? null;
  const firstOutput = outputs[0] ?? null;

  if (!params.regenerate && latest) {
    return mapRecognitionOutput(latest);
  }

  if (params.regenerate && outputs.length >= 2) {
    return latest ? mapRecognitionOutput(latest) : null;
  }

  const cleanResponses = session.entry_mirror_responses
    .map((item) => ({
      questionKey: item.question_key.trim(),
      questionText: item.question_text.trim(),
      response: item.response.trim(),
    }))
    .filter(
      (item) =>
        item.questionKey.length > 0 &&
        item.questionText.length > 0 &&
        item.response.length > 0,
    );

  if (cleanResponses.length < 8) {
    console.error("Recognition requires at least 8 completed responses.");
    return null;
  }

  const entryType = ["female", "male", "neutral"].includes(session.entry_type)
    ? (session.entry_type as RecognitionType)
    : "neutral";

  const perception = buildRecognitionPerception(cleanResponses);
  const clarityMap = buildRecognitionClarityMap(
    perception.answers.map((answer) => ({
      questionKey: answer.questionKey,
      response: answer.response,
      normalizedResponse: answer.normalizedResponse,
      evidenceTypes: [
        ...new Set(answer.perception.evidence.map((evidence) => evidence.type)),
      ],
    })),
    perception.supportedTensions.map((item) => item.term),
  );
  const participantSignals = buildRecognitionParticipantSignalMap(
    perception.answers,
    perception.recurringLanguage,
    perception.supportedThemes,
  );
  const relationshipMap = buildRecognitionRelationshipMap(
    perception.answers,
    perception.recurringLanguage,
  );
  const movementMap = buildRecognitionMovementMap(
    perception.answers,
    perception.recurringLanguage,
  );
  const evidenceCalibration = buildRecognitionEvidenceCalibrationMap({
    perception,
    clarityMap,
    participantSignals,
    relationshipMap,
    movementMap,
  });

  const prompt = buildRecognitionPrompt({
    firstName: session.entry_leads.first_name,
    previousOutput: firstOutput?.output ?? null,
    regenerate: Boolean(params.regenerate),
    responses: cleanResponses,
    perception,
    clarityMap,
    participantSignals,
    relationshipMap,
    movementMap,
    evidenceCalibration,
  });

  const output = await generateAI({
    task: "recognition_synthesis",
    prompt,
    maxTokens: 1400,
  });

  if (!output) return null;

  const questions = extractQuestionsFromOutput(output);
  const themesDetected = perception.supportedThemes.map((item) => item.term);
  const tensionsDetected = perception.supportedTensions.map((item) => item.term);

  const saved = await prisma.entry_mirror_outputs.create({
    data: {
      session_id: session.id,
      output,
      questions,
      themes_detected: themesDetected,
      tensions_detected: tensionsDetected,
      input_snapshot: {
        entryType,
        leadId: session.lead_id,
        responseCount: cleanResponses.length,
        questionKeys: cleanResponses.map((item) => item.questionKey),
        questionTexts: cleanResponses.map((item) => item.questionText),
        recurringLanguage: perception.recurringLanguage,
        recurringObservations: perception.recurringObservations,
        supportedThemes: perception.supportedThemes,
        supportedTensions: perception.supportedTensions,
        languageFamilies: perception.languageFamilies,
        languageCorrections: perception.answers.map((answer) => ({
          questionKey: answer.questionKey,
          corrections: answer.languageCorrections,
        })),
        clarityMap,
        participantSignals,
        relationshipMap,
        movementMap,
        evidenceCalibration,
      },
    },
    select: {
      id: true,
      session_id: true,
      output: true,
      questions: true,
      themes_detected: true,
      tensions_detected: true,
      created_at: true,
    },
  });

  await prisma.entry_mirror_sessions.update({
    where: { id: session.id },
    data: {
      status: "completed",
      completed_at: new Date(),
      mirror_generated_at: new Date(),
    },
  });

  return mapRecognitionOutput(saved);
}

function mapRecognitionOutput(output: {
  id: string;
  session_id: string;
  output: string;
  questions: string[];
  themes_detected: string[];
  tensions_detected: string[];
  created_at: Date;
}): RecognitionOutputDTO {
  return {
    id: output.id,
    sessionId: output.session_id,
    output: output.output,
    questions: output.questions,
    themesDetected: output.themes_detected,
    tensionsDetected: output.tensions_detected,
    createdAt: output.created_at.toISOString(),
  };
}
