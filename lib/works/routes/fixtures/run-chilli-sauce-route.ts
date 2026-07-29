import { createProductBrief } from "@/lib/works/briefs/create-product-brief";
import { CHILLI_SAUCE_BRIEF_FIXTURE } from "@/lib/works/briefs/fixtures/chilli-sauce";
import { calculateBriefMatches } from "@/lib/works/matching/calculate-brief-matches";
import { getRouteSummary } from "@/lib/works/routes/get-route-summary";
import { planBriefRoutes } from "@/lib/works/routes/plan-brief-routes";

export async function runChilliSauceRouteFixture() {
  const brief = await createProductBrief(CHILLI_SAUCE_BRIEF_FIXTURE);
  await calculateBriefMatches(brief.id);
  const routes = await planBriefRoutes(brief.id);
  const recommended = await getRouteSummary(brief.id, 1);

  return {
    briefId: brief.id,
    routes,
    recommended,
  };
}
