import { z } from "zod";
import { handleSchema, meSchema } from "./user";

/**
 * World ID session flow (backend-driven bridge — see SPEC §3):
 * the client only creates a session, opens `connectorURI`, and polls status.
 * All crypto/bridge/verification happens on the Worker.
 */
export const worldIdStateSchema = z.enum(["pending", "confirmed", "failed"]);
export type WorldIdState = z.infer<typeof worldIdStateSchema>;

export const createWorldIdSessionInputSchema = z.object({
  /**
   * Deep link World App bounces back to. The client supplies its own
   * (`Linking.createURL(...)`) because inside Expo Go the app's custom scheme
   * is `exp://…`, not the production scheme. Falls back to
   * `${APP_SCHEME}://worldid/callback` server-side.
   */
  returnTo: z.string().url().optional(),
  /** Dev-only: stable per-device fake nullifier (WORLD_VERIFY_MODE=mock). */
  mockNullifier: z.string().min(8).max(120).optional(),
});
export type CreateWorldIdSessionInput = z.infer<typeof createWorldIdSessionInputSchema>;

export const createWorldIdSessionResponseSchema = z.object({
  sessionId: z.string(),
  /** URL that opens World App (Selfie Check). Empty string in mock mode. */
  connectorURI: z.string(),
});
export type CreateWorldIdSessionResponse = z.infer<typeof createWorldIdSessionResponseSchema>;

export const getWorldIdSessionInputSchema = z.object({
  sessionId: z.string().min(1),
});

/**
 * Session status. On `confirmed` the backend has already verified the proof,
 * upserted the user by nullifier and minted a session JWT — login happens in
 * the same response.
 */
export const worldIdSessionStatusSchema = z.object({
  state: worldIdStateSchema,
  /** machine-readable failure reason (e.g. 'user_rejected', 'timeout') */
  error: z.string().nullable(),
  /** our HS256 JWT — present only when state === 'confirmed' */
  token: z.string().nullable(),
  /** `user.onboarded === false` → client must show the handle-picking screen */
  user: meSchema.nullable(),
});
export type WorldIdSessionStatus = z.infer<typeof worldIdSessionStatusSchema>;

export const completeOnboardingInputSchema = z.object({
  handle: handleSchema,
});
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingInputSchema>;
