# Oremea agent context

Oremea is the canonical source for Oremea product truth. This file gives coding agents a safe reading order and non-negotiable boundaries. It does not replace executable contracts.

## Read first

Before changing product behavior, read the files that own the relevant truth:
- `src/lib/oremea/product-truth.ts`
- `src/lib/oremea/pricing.ts`
- `src/lib/oremea/evidence-boundary.ts`
- `src/lib/oremea/participant-sovereignty.ts`
- `src/lib/oremea/mirror-authoring.ts`
- the product-specific route/component/conversation code for the lane being changed
- any verification script that names the relevant contract

When prose elsewhere disagrees with these source files, do not invent a compromise. Resolve the inconsistency against the canonical source.

## Canonical product/commercial truth

Current machine-readable product truth is owned by `src/lib/oremea/product-truth.ts`.

Current commercial facts are owned by `src/lib/oremea/pricing.ts`.

Do not hard-code alternate prices, purchase types, billing intervals, visibility, or canonical paths in another subsystem merely for convenience.

DAWN may read Oremea truth through the protected export. DAWN is not allowed to become a second product-truth source.

Do not infer that a product missing from the canonical product-truth export is publicly launched, commercially available, or approved for discovery.

## Participant evidence boundary

Participant-written language is primary evidence.

- Stay close to the participant's actual words.
- Current participant material has foreground authority; earlier material is context, not destiny.
- Generated questions, prior AI reflections, summaries, maps, reframes, and model interpretations are never proof about the participant.
- Do not turn tone, punctuation, intensity, repetition, or rhetorical form into a named emotion.
- Do not manufacture motive, diagnosis, hidden cause, identity, attachment style, trauma explanation, or psychological certainty.
- Repetition is recurrence before it is meaning.
- A participant correction outranks an earlier model reading.
- Preserve literal participant-supplied dates, amounts, counts, names, deadlines, and durations unless a clearly stated derivation is required.
- Interpretation beyond direct evidence must remain proportionate and visibly tentative.

If product-specific instructions and the evidence boundary seem to conflict, preserve participant sovereignty and narrow the interpretation.

## Product-lane integrity

Do not blur product jobs together.

Use the canonical product descriptions as the first routing constraint.

Recognition is a private conversational witness. Recognition must not silently become Compass:
- no forced destination;
- no action plan merely because clarity appeared;
- no productivity framing;
- no homework by default;
- no model-created explanation presented as participant truth.

Compass may support direction and movement, but should not rewrite Recognition's reflective method.

Resonance is a bounded room and should stay inside the participant's own material rather than becoming advice, diagnosis, or a theory about the person.

The Current is member-only according to canonical product truth. Do not expose it publicly merely because code exists.

## AI gateway

Shared AI access runs through `src/lib/ai/ai-gateway.ts`.

- Prefer one governed gateway over product-specific ad hoc API calls.
- Structured output remains opt-in by task and must stay schema-bound where the product contract requires it.
- Keep task prompts and system context bounded to what the current task needs.
- Reuse stable policy context through caching where already designed; do not dump unrelated history into every request.
- Product-specific memory should remain bounded, evidence-linked, and relevant to the current turn.
- Model fallback must not weaken product evidence boundaries.
- Never log API keys or raw secrets.
- A model response is generated output, not product truth and not participant evidence.

## Recognition memory

Recognition's longitudinal memory is an index back to participant evidence, not a model-authored biography.

- Store only bounded participant evidence that passes the Recognition memory contract.
- Never store generated Recognition wording as evidence about the participant.
- Keep prompt memory selection relevant and bounded rather than loading the entire memory set every turn.
- Current participant wording remains foreground authority.

## Protected machine-to-machine routes

Internal DAWN truth routes use bearer protection and no-store/noindex behavior.

Do not make protected truth endpoints public just to simplify a connector.

Authentication and permission are separate:
- a valid bearer token proves the caller may reach the export;
- it does not grant DAWN authority to modify Oremea truth.

## Change workflow

For material changes:
1. inspect the canonical source and existing contract tests;
2. change the smallest coherent surface;
3. add/update a verification test when the behavior is important enough to guard;
4. use a bounded branch and PR;
5. state what changed and what did not;
6. inspect exact CI failures instead of bypassing them;
7. merge only when the relevant checks are green unless the human owner explicitly authorizes another path.

Do not fix one product by weakening a shared evidence or sovereignty boundary for every product.

## Context and external agent frameworks

Use repo context progressively:
- load compact project rules first;
- load the product-specific method only when working in that lane;
- load large reference material only when the task needs it.

Borrow useful patterns from external agent frameworks when they strengthen these boundaries. Do not install Hermes or another autonomous runtime inside Oremea merely because it provides memory, skills, cron, or subagents. Oremea's participant-facing products should remain method-governed; operational autonomy belongs in a separately governed control plane such as DAWN unless explicitly designed otherwise.
