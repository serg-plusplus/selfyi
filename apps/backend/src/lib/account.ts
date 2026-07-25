import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { ulid } from "@selfie/common";
import type { DB } from "../db/client";
import { users, type UserRow } from "../db/schema";

/** Placeholder handle until onboarding: `user_` + ULID tail (unique enough). */
const placeholderHandle = (id: string) => `user_${id.slice(-8).toLowerCase()}`;

/**
 * Upsert by world_nullifier (SPEC §3.5, adapted): in this app World ID *is*
 * the login, so a known nullifier means a RETURNING user (log into the same
 * account) rather than `already_used` — one human still maps to exactly one
 * account. The UNIQUE constraint makes concurrent creation race-safe.
 */
export async function findOrCreateUserByNullifier(db: DB, nullifier: string): Promise<UserRow> {
  const find = () =>
    db.select().from(users).where(eq(users.worldNullifier, nullifier)).limit(1);

  const existing = await find();
  if (existing[0]) return existing[0];

  const id = ulid();
  try {
    const inserted = await db
      .insert(users)
      .values({ id, worldNullifier: nullifier, handle: placeholderHandle(id) })
      .returning();
    if (inserted[0]) return inserted[0];
  } catch {
    // a concurrent login created the row — fall through to re-find
  }
  const again = await find();
  if (again[0]) return again[0];
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create user" });
}
