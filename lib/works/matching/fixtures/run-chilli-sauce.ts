import { createProductBrief } from "@/lib/works/briefs/create-product-brief";
import { CHILLI_SAUCE_BRIEF_FIXTURE } from "@/lib/works/briefs/fixtures/chilli-sauce";
import { calculateBriefMatches } from "@/lib/works/matching/calculate-brief-matches";

export async function runChilliSauceMatchFixture() {
  const brief = await createProductBrief(CHILLI_SAUCE_BRIEF_FIXTURE);
  const matches = await calculateBriefMatches(brief.id);

  return {
    brief,
    matches,
  };
}
