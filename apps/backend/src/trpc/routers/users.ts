import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { profileSchema, type Profile } from "@selfie/common";
import type { Context } from "../context";
import { connections, users, type UserRow } from "../../db/schema";
import { applyMockAutoApprovals } from "../../lib/mockApprove";
import { toUserApi } from "../../lib/serialize";
import { protectedProcedure, router } from "../trpc";

const pairKeyOf = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

async function toProfile(ctx: Context & { userId: string }, user: UserRow): Promise<Profile> {
  await applyMockAutoApprovals(ctx.db, [ctx.userId]);

  const rows = await ctx.db
    .select()
    .from(connections)
    .where(eq(connections.pairKey, pairKeyOf(ctx.userId, user.id)))
    .limit(1);

  const c = rows[0];
  const connection =
    !c || c.status === "declined" || user.id === ctx.userId
      ? null
      : {
          id: c.id,
          status: c.status as "pending" | "approved",
          direction: (c.requesterId === ctx.userId ? "outgoing" : "incoming") as
            | "outgoing"
            | "incoming",
        };

  return { ...toUserApi(user), connection };
}

export const usersRouter = router({
  getByHandle: protectedProcedure
    .input(z.object({ handle: z.string() }))
    .output(profileSchema)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(users)
        .where(eq(users.handle, input.handle.toLowerCase()))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return toProfile(ctx, rows[0]);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(profileSchema)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return toProfile(ctx, rows[0]);
    }),
});
