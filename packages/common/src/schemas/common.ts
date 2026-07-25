import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants";

/** ULID — 26 chars, Crockford base32 */
export const ulidSchema = z.string().length(26);

/** ISO-8601 timestamp string (how timestamptz is serialized over the wire) */
export const isoDateSchema = z.string();

export const paginationInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationInput = z.infer<typeof paginationInputSchema>;

/** A cursor-paginated page: `nextCursor` is null when there are no more rows. */
export function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export const okSchema = z.object({ ok: z.literal(true) });
export type Ok = z.infer<typeof okSchema>;
