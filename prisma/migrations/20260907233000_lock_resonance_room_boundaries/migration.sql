-- Give Resonance room four its own identity. The previous internal slug borrowed
-- the separate Compass product name and could reintroduce that lane in exports.
UPDATE "rooms"
SET "slug" = 'bearing'
WHERE "slug" = 'compass'
  AND "week_number" = 4
  AND NOT EXISTS (
    SELECT 1 FROM "rooms" AS existing WHERE existing."slug" = 'bearing'
  );

-- These narrow wording updates keep existing prompt ids and participant progress
-- intact while removing the remaining cross-lane or pressure language.
UPDATE "day_prompts" AS prompt
SET "content" = 'Where your words and actions do not match right now, what does the mismatch show is receiving priority in practice?'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 4
  AND day."day_number" = 5
  AND prompt."prompt_order" = 4
  AND prompt."is_published" = true
  AND prompt."content" = 'Where your words and actions do not match right now, what is the smallest real correction you could make?';

UPDATE "day_prompts" AS prompt
SET "content" = 'Choose one place where what you say matters and what you are doing do not quite match. Write: what I say matters → what I am doing now → what that is producing → what appears to be receiving priority in practice.'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 4
  AND day."day_number" = 5
  AND prompt."prompt_order" = 5
  AND prompt."is_published" = true
  AND prompt."content" = 'Choose one place where what you say matters and what you are doing do not quite match. Write: what matters to me → what I am doing now → what that is producing → what I will do next.';

UPDATE "day_prompts" AS prompt
SET "content" = 'When a choice costs something that matters to you, how do you tell whether it was a trade-off you accept or a priority you want to reconsider?'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 4
  AND day."day_number" = 6
  AND prompt."prompt_order" = 2
  AND prompt."is_published" = true
  AND prompt."content" = 'When you act against something that matters to you, what usually needs to be put right afterward?';

UPDATE "day_prompts" AS prompt
SET "content" = 'What current action already makes your actual direction visible, even if your stated intention points somewhere else?'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 4
  AND day."day_number" = 6
  AND prompt."prompt_order" = 4
  AND prompt."is_published" = true
  AND prompt."content" = 'What is one action you could take next that would make your actual direction obvious?';

UPDATE "day_prompts" AS prompt
SET "content" = 'Choose one area where your priorities keep shifting. Write: what I said mattered → the first sign it received less → what received more → the cost → what this shows about my priority now.'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 4
  AND day."day_number" = 6
  AND prompt."prompt_order" = 5
  AND prompt."is_published" = true
  AND prompt."content" = 'Choose one area where you keep getting off track. Write: the first sign → what I will do when I notice it → what needs to be repaired if I miss it → when I will check again.';

UPDATE "day_prompts" AS prompt
SET "content" = 'What, if anything, is clearer now because you placed these pieces beside one another?'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 9
  AND day."day_number" = 7
  AND prompt."prompt_order" = 4
  AND prompt."is_published" = true
  AND prompt."content" = 'What is easier to choose or do now because you gathered these pieces?';

UPDATE "day_prompts" AS prompt
SET "content" = 'Finish this from what you have actually noticed this week: I see ___. I care about ___. These pieces connect through ___, or remain separate because ___. I am still unsure about ___. I want to carry forward ___.'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 9
  AND day."day_number" = 7
  AND prompt."prompt_order" = 5
  AND prompt."is_published" = true
  AND prompt."content" = 'Finish this from what you have actually noticed this week: I see ___. I care about ___. I choose ___. I am still unsure about ___. My next step is ___.';

UPDATE "day_prompts" AS prompt
SET "content" = 'What tells you whether rest is the right choice, the practice needs adjusting, or you want to resume?'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 10
  AND day."day_number" = 4
  AND prompt."prompt_order" = 3
  AND prompt."is_published" = true
  AND prompt."content" = 'How can you tell when you genuinely need rest and when you have simply lost the thread?';

UPDATE "day_prompts" AS prompt
SET "content" = 'Write a continuation plan: the practice I am keeping → what will show me it is happening in real life → when I want to review it → the next action I choose and when it would fit.'
FROM "journey_days" AS day
JOIN "journey_weeks" AS week ON week."id" = day."week_id"
WHERE prompt."day_id" = day."id"
  AND week."week_number" = 10
  AND day."day_number" = 7
  AND prompt."prompt_order" = 5
  AND prompt."is_published" = true
  AND prompt."content" = 'Write a continuation plan: the practice I am keeping → what I will measure → when I will review it → the next action I will take within twenty-four hours.';
