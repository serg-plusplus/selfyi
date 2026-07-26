import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants";

export const ulidSchema = z.string().length(26);

export const isoDateSchema = z.string();

export const paginationInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationInput = z.infer<typeof paginationInputSchema>;

export function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export const okSchema = z.object({ ok: z.literal(true) });
export type Ok = z.infer<typeof okSchema>;
