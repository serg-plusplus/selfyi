export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  WORLD_ID_SESSION: DurableObjectNamespace;

  ENVIRONMENT: string;
  STREAM_ACCOUNT_ID: string;
  STREAM_CUSTOMER_CODE: string;
  WORLD_APP_ID: string;
  WORLD_RP_ID: string;
  WORLD_ACTION: string;
  WORLD_ENV: string;
  APP_SCHEME: string;
  WORLD_VERIFY_MODE?: string;
  CORS_ORIGINS?: string;

  JWT_SECRET: string;
  STREAM_API_TOKEN: string;
  STREAM_WEBHOOK_SECRET: string;
  WORLD_RP_SIGNING_KEY: string;
}
