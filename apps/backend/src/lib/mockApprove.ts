import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { connections } from "../db/schema";

/**
 * Lazy auto-approve for mock users (Decision 12): pending requests addressed
 * to a mock user carry `auto_approve_at`; any read that touches connections
 * calls this first, flipping overdue rows to 'approved'. No queues, no crons —
 * the delay (5–30s) exists purely so the demo feels human.
 */
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
