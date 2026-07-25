import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { connectionsRouter } from "./routers/connections";
import { feedRouter } from "./routers/feed";
import { usersRouter } from "./routers/users";
import { videosRouter } from "./routers/videos";
import { worldidRouter } from "./routers/worldid";

/**
 * The whole API surface. `AppRouter` (the *type*) is what the mobile app
 * imports for end-to-end type safety.
 */
export const appRouter = router({
  worldid: worldidRouter,
  auth: authRouter,
  feed: feedRouter,
  videos: videosRouter,
  users: usersRouter,
  connections: connectionsRouter,
});

export type AppRouter = typeof appRouter;
