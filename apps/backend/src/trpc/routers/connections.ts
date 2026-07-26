import { TRPCError } from "@trpc/server";
import { desc, eq, lt, or, and, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import {
  connectionPageSchema,
  connectionSchema,
  inboxInputSchema,
  MOCK_APPROVE_DELAY_MAX_SEC,
  MOCK_APPROVE_DELAY_MIN_SEC,
  respondConnectInputSchema,
  sendConnectInputSchema,
  ulid,
  type Connection,
} from "@selfie/common";
import { connections, users, type ConnectionRow, type UserRow } from "../../db/schema";
import { applyMockAutoApprovals } from "../../lib/mockApprove";
import { toUserApi } from "../../lib/serialize";
import { protectedProcedure, router } from "../trpc";

const nowIso = () => new Date().toISOString();
const nowSql = () => sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;
const pairKeyOf = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

function mockApproveAt(): string {
  const span = MOCK_APPROVE_DELAY_MAX_SEC - MOCK_APPROVE_DELAY_MIN_SEC;
  const delay = MOCK_APPROVE_DELAY_MIN_SEC + Math.floor(Math.random() * (span + 1));
  return new Date(Date.now() + delay * 1000).toISOString();
}

function toConnectionApi(c: ConnectionRow, viewerId: string, other: UserRow): Connection {
  const approved = c.status === "approved";
  return {
    id: c.id,
    status: c.status as Connection["status"],
    direction: c.requesterId === viewerId ? "outgoing" : "incoming",
    other: toUserApi(other),
    other_contacts: approved ? { instagram: other.instagram, whatsapp: other.whatsapp } : null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export const connectionsRouter = router({
  send: protectedProcedure
    .input(sendConnectInputSchema)
    .output(connectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot connect to yourself" });
      }
      const targetRows = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      const target = targetRows[0];
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const pairKey = pairKeyOf(ctx.userId, input.userId);
      const autoApproveAt = target.isMock === 1 ? mockApproveAt() : null;

      const existingRows = await ctx.db
        .select()
        .from(connections)
        .where(eq(connections.pairKey, pairKey))
        .limit(1);
      const existing = existingRows[0];

      if (existing) {
        if (existing.status === "approved") {
          return toConnectionApi(existing, ctx.userId, target);
        }
        if (existing.status === "pending") {
          throw new TRPCError({ code: "CONFLICT", message: "Request already pending" });
        }
        const updated = await ctx.db
          .update(connections)
          .set({
            status: "pending",
            requesterId: ctx.userId,
            addresseeId: input.userId,
            autoApproveAt,
            updatedAt: nowSql() as never,
          })
          .where(eq(connections.id, existing.id))
          .returning();
        return toConnectionApi(updated[0]!, ctx.userId, target);
      }

      const inserted = await ctx.db
        .insert(connections)
        .values({
          id: ulid(),
          pairKey,
          requesterId: ctx.userId,
          addresseeId: input.userId,
          status: "pending",
          autoApproveAt,
        })
        .returning();
      return toConnectionApi(inserted[0]!, ctx.userId, target);
    }),

  inbox: protectedProcedure
    .input(inboxInputSchema)
    .output(connectionPageSchema)
    .query(async ({ ctx, input }) => {
      await applyMockAutoApprovals(ctx.db, [ctx.userId]);

      const otherUser = alias(users, "other_user");
      const involvesMe = or(
        eq(connections.requesterId, ctx.userId),
        eq(connections.addresseeId, ctx.userId),
      );
      const visible = or(
        eq(connections.status, "approved"),
        eq(connections.status, "pending"),
      );

      const rows = await ctx.db
        .select({ connection: connections, other: otherUser })
        .from(connections)
        .innerJoin(
          otherUser,
          or(
            and(eq(connections.requesterId, ctx.userId), eq(otherUser.id, connections.addresseeId)),
            and(eq(connections.addresseeId, ctx.userId), eq(otherUser.id, connections.requesterId)),
          ),
        )
        .where(and(involvesMe, visible, input.cursor ? lt(connections.id, input.cursor) : undefined))
        .orderBy(desc(connections.updatedAt), desc(connections.id))
        .limit(input.limit);

      const items = rows.map((r) => toConnectionApi(r.connection, ctx.userId, r.other));
      const last = rows[rows.length - 1];
      return {
        items,
        nextCursor: rows.length === input.limit && last ? last.connection.id : null,
      };
    }),

  respond: protectedProcedure
    .input(respondConnectInputSchema)
    .output(connectionSchema)
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(connections)
        .where(eq(connections.id, input.id))
        .limit(1);
      const c = rows[0];
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      if (c.addresseeId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      if (c.status !== "pending") {
        throw new TRPCError({ code: "CONFLICT", message: "Request is not pending" });
      }

      const status = input.action === "approve" ? "approved" : "declined";
      const updated = await ctx.db
        .update(connections)
        .set({ status, autoApproveAt: null, updatedAt: nowIso() })
        .where(eq(connections.id, input.id))
        .returning();

      const otherId = c.requesterId;
      const otherRows = await ctx.db.select().from(users).where(eq(users.id, otherId)).limit(1);
      if (!otherRows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return toConnectionApi(updated[0]!, ctx.userId, otherRows[0]);
    }),
});
