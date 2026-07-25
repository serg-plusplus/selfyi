import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  MAX_VIDEO_DURATION_SEC,
  okSchema,
  ulid,
  ulidSchema,
  uploadUrlResponseSchema,
  videoSchema,
} from "@selfie/common";
import { users, videos } from "../../db/schema";
import { invalidateFeedCache } from "../../lib/feedCache";
import { toVideoApi } from "../../lib/serialize";
import { createDirectUpload, deleteStreamVideo } from "../../services/stream";
import { protectedProcedure, router } from "../trpc";

const idInput = z.object({ id: ulidSchema });

export const videosRouter = router({
  /**
   * Create a Stream direct upload + a 'processing' video row. The client
   * uploads the file to `uploadURL`; the Stream webhook flips it to 'ready'.
   */
  getUploadUrl: protectedProcedure
    .output(uploadUrlResponseSchema)
    .mutation(async ({ ctx }) => {
      const videoId = ulid();
      const { uploadURL, uid } = await createDirectUpload(ctx.env, {
        maxDurationSeconds: MAX_VIDEO_DURATION_SEC,
        creator: ctx.userId,
        meta: { videoId, authorId: ctx.userId },
      });

      await ctx.db.insert(videos).values({
        id: videoId,
        authorId: ctx.userId,
        streamUid: uid,
        playbackId: uid, // Stream serves HLS off the uid; webhook may refine
        status: "processing",
      });

      return { uploadURL, videoId, streamUid: uid };
    }),

  get: protectedProcedure
    .input(idInput)
    .output(videoSchema)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ video: videos, author: users })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.authorId))
        .where(eq(videos.id, input.id))
        .limit(1);
      const row = rows[0];
      if (!row || row.video.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = ctx.userId === row.video.authorId;
      if (row.video.status !== "ready" && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return toVideoApi(row.video, row.author);
    }),

  delete: protectedProcedure
    .input(idInput)
    .output(okSchema)
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ authorId: videos.authorId, streamUid: videos.streamUid })
        .from(videos)
        .where(eq(videos.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (rows[0].authorId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.db
        .update(videos)
        .set({ deletedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` as never })
        .where(eq(videos.id, input.id));

      ctx.waitUntil(deleteStreamVideo(ctx.env, rows[0].streamUid).catch(() => {}));
      ctx.waitUntil(invalidateFeedCache(ctx.env).catch(() => {}));
      return { ok: true };
    }),
});
