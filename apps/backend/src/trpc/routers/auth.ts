import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import {
  completeOnboardingInputSchema,
  meSchema,
  updateContactsInputSchema,
} from "@selfie/common";
import { users } from "../../db/schema";
import { toMeApi } from "../../lib/serialize";
import { protectedProcedure, router } from "../trpc";

const now = () => sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const authRouter = router({
  completeOnboarding: protectedProcedure
    .input(completeOnboardingInputSchema)
    .output(meSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await ctx.db
          .update(users)
          .set({ handle: input.handle.toLowerCase(), onboarded: 1, updatedAt: now() as never })
          .where(eq(users.id, ctx.userId))
          .returning();
        if (!updated[0]) throw new TRPCError({ code: "NOT_FOUND" });
        return toMeApi(updated[0]);
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({ code: "CONFLICT", message: "Handle already taken", cause: e });
      }
    }),

  me: protectedProcedure.output(meSchema).query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
    return toMeApi(rows[0]);
  }),

  updateContacts: protectedProcedure
    .input(updateContactsInputSchema)
    .output(meSchema)
    .mutation(async ({ ctx, input }) => {
      const patch: Partial<typeof users.$inferInsert> = { updatedAt: now() as never };
      if (input.instagram !== undefined) patch.instagram = input.instagram;
      if (input.whatsapp !== undefined) patch.whatsapp = input.whatsapp;

      const updated = await ctx.db
        .update(users)
        .set(patch)
        .where(eq(users.id, ctx.userId))
        .returning();
      if (!updated[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return toMeApi(updated[0]);
    }),
});
