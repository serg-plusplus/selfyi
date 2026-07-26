import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { connections } from "../db/schema";

export async function applyMockAutoApprovals(db: DB, userIds?: string[]): Promise<void> {
  const now = new Date().toISOString();
  const overdue = and(
    eq(connections.status, "pending"),
    isNotNull(connections.autoApproveAt),
    lte(connections.autoApproveAt, now),
  );
  const where = userIds?.length
    ? and(overdue, inArray(connections.requesterId, userIds))
    : overdue;

  await db
    .update(connections)
    .set({
      status: "approved",
      autoApproveAt: null,
      updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    })
    .where(where);
}
