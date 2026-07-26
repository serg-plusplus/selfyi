import { z } from "zod";
import { handleSchema, meSchema } from "./user";

export const worldIdStateSchema = z.enum(["pending", "confirmed", "failed"]);
export type WorldIdState = z.infer<typeof worldIdStateSchema>;

export const createWorldIdSessionInputSchema = z.object({
  returnTo: z.string().url().optional(),
  mockNullifier: z.string().min(8).max(120).optional(),
});
export type CreateWorldIdSessionInput = z.infer<typeof createWorldIdSessionInputSchema>;

export const createWorldIdSessionResponseSchema = z.object({
  sessionId: z.string(),
  connectorURI: z.string(),
});
export type CreateWorldIdSessionResponse = z.infer<typeof createWorldIdSessionResponseSchema>;

export const getWorldIdSessionInputSchema = z.object({
  sessionId: z.string().min(1),
});

export const worldIdSessionStatusSchema = z.object({
  state: worldIdStateSchema,
  error: z.string().nullable(),
  token: z.string().nullable(),
  user: meSchema.nullable(),
});
export type WorldIdSessionStatus = z.infer<typeof worldIdSessionStatusSchema>;

export const completeOnboardingInputSchema = z.object({
  handle: handleSchema,
});
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingInputSchema>;
