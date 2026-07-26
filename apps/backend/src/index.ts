import "./idkit-wasm";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { webhooks } from "./http/webhooks";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";

export type { AppRouter } from "./trpc/router";
export { WorldIdSession } from "./do/WorldIdSession";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: (origin, c) => {
    const allowed = (c.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (allowed.length === 0) return origin;
    return allowed.includes(origin) ? origin : (allowed[0] ?? null);
  },
  allowHeaders: ["Authorization", "Content-Type"],
  credentials: true,
}));

app.get("/", (c) => c.json({ ok: true, service: "selfie-backend", env: c.env.ENVIRONMENT }));

app.all("/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () =>
      createContext({ req: c.req.raw, env: c.env, executionCtx: c.executionCtx }),
  }),
);

app.route("/stream/webhook", webhooks);

export default app;
