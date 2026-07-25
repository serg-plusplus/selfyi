import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";
import * as schema from "./schema";

export type DB = ReturnType<typeof createDb>;
export type Schema = typeof schema;

/**
 * Drizzle over the D1 binding. Works identically in `wrangler dev` (local
 * SQLite in .wrangler/) and in production — no connection strings anywhere.
 */
export function createDb(env: Env) {
  return drizzle(env.DB, { schema });
}

export { schema };
