// MUST be first: registers the precompiled IDKit WASM module before any
// idkit-core code can attempt its (Worker-incompatible) default init.
import "./idkit-wasm";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { webhooks } from "./http/webhooks";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";

// The contract the mobile app imports for end-to-end type safety.
export type { AppRouter } from "./trpc/router";
// Durable Object class export required by the wrangler binding.
export { WorldIdSession } from "./do/WorldIdSession";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: (origin, c) => {
    const allowed = (c.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (allowed.length === 0) return origin; // permissive when unconfigured (dev)
    return allowed.includes(origin) ? origin : (allowed[0] ?? null);
  },
  allowHeaders: ["Authorization", "Content-Type"],
  credentials: true,
}));

app.get("/", (c) => c.json({ ok: true, service: "selfie-backend", env: c.env.ENVIRONMENT }));

// All app traffic goes through tRPC (native fetch adapter mounted on Hono).
app.all("/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () =>
      createContext({ req: c.req.raw, env: c.env, executionCtx: c.executionCtx }),
  }),
);

// Webhooks are the one plain-HTTP surface (external callers, HMAC-verified).
app.route("/stream/webhook", webhooks);

export default app;
