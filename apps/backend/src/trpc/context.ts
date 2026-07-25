import { createDb, type DB } from "../db/client";
import type { Env } from "../env";
import { verifyAppJwt } from "../services/jwt";

export interface Context {
  env: Env;
  db: DB;
  req: Request;
  /** Authenticated user id, or null for anonymous/public requests. */
  userId: string | null;
  /** Defer work past the response (CF executionCtx.waitUntil). */
  waitUntil: (p: Promise<unknown>) => void;
}

/** Minimal shape of CF's ExecutionContext — avoids Hono/workers-types drift. */
export interface WaitUntilCtx {
  waitUntil(promise: Promise<unknown>): void;
}

export interface CreateContextOptions {
  req: Request;
  env: Env;
  executionCtx?: WaitUntilCtx;
  /** allow injecting a db in tests */
  db?: DB;
}

export async function createContext(opts: CreateContextOptions): Promise<Context> {
  const { req, env, executionCtx } = opts;
  const db = opts.db ?? createDb(env);

  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const payload = await verifyAppJwt(token, env.JWT_SECRET);
      userId = typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      // invalid/expired token → treat as anonymous; protectedProcedure will 401
      userId = null;
    }
  }

  const noopWaitUntil = (p: Promise<unknown>) => {
    void p.catch(() => {});
  };

  return {
    env,
    db,
    req,
    userId,
    waitUntil: executionCtx ? (p) => executionCtx.waitUntil(p) : noopWaitUntil,
  };
}
