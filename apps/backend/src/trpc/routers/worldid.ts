import { TRPCError } from "@trpc/server";
import {
  createWorldIdSessionInputSchema,
  createWorldIdSessionResponseSchema,
  getWorldIdSessionInputSchema,
  ulid,
  worldIdSessionStatusSchema,
  type WorldIdSessionStatus,
} from "@selfie/common";
import type { Context } from "../context";
import { findOrCreateUserByNullifier } from "../../lib/account";
import { toMeApi } from "../../lib/serialize";
import { signAppJwt } from "../../services/jwt";
import { publicProcedure, router } from "../trpc";

const MOCK_KV_PREFIX = "worldid:mock:";
const MOCK_TTL_SEC = 15 * 60;

/** Confirmed → verify already done (DO); upsert user + mint the session JWT. */
async function confirm(ctx: Context, nullifier: string): Promise<WorldIdSessionStatus> {
  const user = await findOrCreateUserByNullifier(ctx.db, nullifier);
  const token = await signAppJwt(user.id, ctx.env.JWT_SECRET);
  return { state: "confirmed", error: null, token, user: toMeApi(user) };
}

/**
 * World ID session flow (SPEC §3, transport mapped REST→tRPC):
 *   POST /worldid/session      → worldid.createSession
 *   GET  /worldid/session/:id  → worldid.getSession
 *
 * The client only opens `connectorURI` and polls `getSession`. RP signing,
 * bridge crypto, polling and proof verification all live in the
 * WorldIdSession Durable Object (SPEC §4 variant B).
 */
export const worldidRouter = router({
  createSession: publicProcedure
    .input(createWorldIdSessionInputSchema)
    .output(createWorldIdSessionResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionId = ulid();

      // Dev-only mock: no World App, no bridge — instant confirm on poll.
      if (ctx.env.WORLD_VERIFY_MODE === "mock") {
        const nullifier = input.mockNullifier ?? `mock-${sessionId}`;
        await ctx.env.KV.put(`${MOCK_KV_PREFIX}${sessionId}`, nullifier, {
          expirationTtl: MOCK_TTL_SEC,
        });
        return { sessionId, connectorURI: "" };
      }

      const stub = ctx.env.WORLD_ID_SESSION.get(
        ctx.env.WORLD_ID_SESSION.idFromName(sessionId),
      );
      const res = await stub.fetch("https://do/start", {
        method: "POST",
        body: JSON.stringify({ sessionId, returnTo: input.returnTo }),
      });
      if (!res.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create World ID session",
        });
      }
      const { connectorURI } = (await res.json()) as { connectorURI: string };
      return { sessionId, connectorURI };
    }),

  getSession: publicProcedure
    .input(getWorldIdSessionInputSchema)
    .output(worldIdSessionStatusSchema)
    .query(async ({ ctx, input }) => {
      // Mock sessions confirm immediately.
      const mockNullifier = await ctx.env.KV.get(`${MOCK_KV_PREFIX}${input.sessionId}`);
      if (mockNullifier) return confirm(ctx, mockNullifier);

      const stub = ctx.env.WORLD_ID_SESSION.get(
        ctx.env.WORLD_ID_SESSION.idFromName(input.sessionId),
      );
      const res = await stub.fetch("https://do/status");
      if (res.status === 404) throw new TRPCError({ code: "NOT_FOUND" });
      if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const body = (await res.json()) as {
        state: "pending" | "confirmed" | "failed";
        error: string | null;
        nullifierHash: string | null;
      };

      if (body.state === "confirmed" && body.nullifierHash) {
        return confirm(ctx, body.nullifierHash);
      }
      return { state: body.state, error: body.error, token: null, user: null };
    }),
});
