import { calculateBriefMatches } from "@/lib/works/matching/calculate-brief-matches";
import { getRouteSummary } from "@/lib/works/routes/get-route-summary";
import { planBriefRoutes } from "@/lib/works/routes/plan-brief-routes";

export async function recalculateProductBrief(briefId: string) {
  const matches = await calculateBriefMatches(briefId);

  try {
    const routes = await planBriefRoutes(briefId);
    const route = routes.length > 0 ? await getRouteSummary(briefId, 1) : null;

    return {
      matches,
      routes,
      route,
      routeError: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No production route is available yet.";

    return {
      matches,
      routes: [],
      route: null,
      routeError: message,
    };
  }
}
