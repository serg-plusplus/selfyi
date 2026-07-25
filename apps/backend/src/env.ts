/**
 * Cloudflare bindings + vars + secrets available to the Worker.
 * Mirrors wrangler.toml. Secrets are injected at runtime (`wrangler secret put`).
 */
export interface Env {
  // --- Bindings ---
  DB: D1Database;
  KV: KVNamespace;
  /** Durable Object holding live World ID bridge sessions (SPEC §3/§4-B). */
  WORLD_ID_SESSION: DurableObjectNamespace;

  // --- Vars (non-secret) ---
  ENVIRONMENT: string;
  STREAM_ACCOUNT_ID: string;
  STREAM_CUSTOMER_CODE: string;
  /** World ID Developer Portal app id (app_…) */
  WORLD_APP_ID: string;
  /** World ID RP id (rp_…) from the Developer Portal */
  WORLD_RP_ID: string;
  /** World ID action identifier (e.g. "selfie-gate") */
  WORLD_ACTION: string;
  /** World environment: "staging" | "production" */
  WORLD_ENV: string;
  /** App scheme for the default return_to deep link (e.g. "selfie") */
  APP_SCHEME: string;
  /** "live" | "mock" — mock skips World App entirely (dev only) */
  WORLD_VERIFY_MODE?: string;
  CORS_ORIGINS?: string;

  // --- Secrets ---
  JWT_SECRET: string;
  STREAM_API_TOKEN: string;
  STREAM_WEBHOOK_SECRET: string;
  /** RP signing key (hex) from the Developer Portal. NEVER leaves the Worker. */
  WORLD_RP_SIGNING_KEY: string;
}
