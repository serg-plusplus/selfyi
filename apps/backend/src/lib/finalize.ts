import { and, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { videos } from "../db/schema";
import type { Env } from "../env";
import { thumbnailUrl } from "../services/stream";
import { invalidateFeedCache } from "./feedCache";

export interface FinalizeParams {
  /** id of the videos row (Stream meta.videoId) */
  videoId: string;
  streamUid: string;
  duration?: number | null;
  thumbnail?: string | null;
}

/**
 * Called when Stream reports a video is ready (webhook). Fills
 * playback/thumbnail/duration and flips status → 'ready', which makes the
 * video feed-eligible. Idempotent via the `status = 'processing'` guard.
 */
export async function markVideoReady(env: Env, db: DB, params: FinalizeParams): Promise<void> {
  const thumb = params.thumbnail ?? thumbnailUrl(env, params.streamUid, 1);

  await db
    .update(videos)
    .set({
      playbackId: params.streamUid,
      thumbnailUrl: thumb,
      durationSec: params.duration ?? null,
      status: "ready",
    })
    .where(and(eq(videos.id, params.videoId), eq(videos.status, "processing")));

  await invalidateFeedCache(env);
}
