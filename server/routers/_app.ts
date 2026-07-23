// server/routers/_app.ts
// Root tRPC router. Assembles active application routers.
// Import AppRouter type in the client for end-to-end type safety.

import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
