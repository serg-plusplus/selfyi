import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";
import * as schema from "./schema";

export type DB = ReturnType<typeof createDb>;
export type Schema = typeof schema;

export function createDb(env: Env) {
  return drizzle(env.DB, { schema });
}

export { schema };
