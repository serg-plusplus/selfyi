import { z } from "zod";
import { pageSchema, paginationInputSchema, ulidSchema } from "./common";
import { videoSchema } from "./video";

export const feedPageSchema = pageSchema(videoSchema);
export type FeedPage = z.infer<typeof feedPageSchema>;

export const userFeedInputSchema = paginationInputSchema.extend({
  userId: ulidSchema,
});
export type UserFeedInput = z.infer<typeof userFeedInputSchema>;
