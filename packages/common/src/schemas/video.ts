import { z } from "zod";
import { isoDateSchema, ulidSchema } from "./common";
import { videoStatusSchema } from "./enums";
import { userSchema } from "./user";

/** Video as returned by the API (author joined). */
export const videoSchema = z.object({
  id: ulidSchema,
  author: userSchema,
  playback_id: z.string(),
  thumbnail_url: z.string().nullable(),
  duration_sec: z.number().nullable(),
  status: videoStatusSchema,
  created_at: isoDateSchema,
});
export type Video = z.infer<typeof videoSchema>;

/** Stream Direct Creator Upload — client uploads straight to `uploadURL`. */
export const uploadUrlResponseSchema = z.object({
  uploadURL: z.string(),
  videoId: ulidSchema,
  streamUid: z.string(),
});
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
