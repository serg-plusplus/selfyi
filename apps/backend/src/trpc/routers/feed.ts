import { and, desc, eq, isNull, lt } from "drizzle-orm";
import {
  feedPageSchema,
  paginationInputSchema,
  userFeedInputSchema,
  type FeedPage,
} from "@selfie/common";
import { users, videos } from "../../db/schema";
import { getCachedFirstPage, setCachedFirstPage } from "../../lib/feedCache";
import { toVideoApi } from "../../lib/serialize";
import { protectedProcedure, router } from "../trpc";

export const feedRouter = router({
  /**
   * The feed: ALL ready videos, newest → oldest (ULID keyset pagination).
   * The cursor-less first page is KV-cached (30s TTL, invalidated on publish).
   */
  main: protectedProcedure
    .input(paginationInputSchema)
    .output(feedPageSchema)
    .query(async ({ ctx, input }) => {
      const isFirstPage = !input.cursor;
      if (isFirstPage) {
        const cached = await getCachedFirstPage(ctx.env);
        if (cached) return cached;
      }

      const where = and(
        eq(videos.status, "ready"),
        isNull(videos.deletedAt),
        input.cursor ? lt(videos.id, input.cursor) : undefined,
      );

      const rows = await ctx.db
        .select({ video: videos, author: users })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.authorId))
        .where(where)
        .orderBy(desc(videos.id))
        .limit(input.limit);

      const items = rows.map((r) => toVideoApi(r.video, r.author));
      const last = rows[rows.length - 1];
      const page: FeedPage = {
        items,
        nextCursor: rows.length === input.limit && last ? last.video.id : null,
      };

      if (isFirstPage) {
        ctx.waitUntil(setCachedFirstPage(ctx.env, page).catch(() => {}));
      }
      return page;
    }),

  /** Videos by one user, newest first. Owner also sees 'processing' uploads. */
  user: protectedProcedure
    .input(userFeedInputSchema)
    .output(feedPageSchema)
    .query(async ({ ctx, input }) => {
      const isOwner = ctx.userId === input.userId;

      const where = and(
        eq(videos.authorId, input.userId),
        isNull(videos.deletedAt),
        isOwner ? undefined : eq(videos.status, "ready"),
        input.cursor ? lt(videos.id, input.cursor) : undefined,
      );

      const rows = await ctx.db
        .select({ video: videos, author: users })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.authorId))
        .where(where)
        .orderBy(desc(videos.id))
        .limit(input.limit);

      const items = rows.map((r) => toVideoApi(r.video, r.author));
      const last = rows[rows.length - 1];
      return {
        items,
        nextCursor: rows.length === input.limit && last ? last.video.id : null,
      };
    }),
});
