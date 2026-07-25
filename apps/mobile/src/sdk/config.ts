import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

/** Env-driven config, read from app.config.ts `extra`. */
export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? "http://localhost:8787",
  streamCustomerCode: extra.streamCustomerCode ?? "",
  /**
   * Dev-only escape hatch: skip World App entirely (backend confirms a fake
   * session). Pairs with WORLD_VERIFY_MODE="mock" on the backend. All real
   * World ID config (app_id, rp_id, action, signing key) is backend-only.
   */
  worldMock: extra.worldMock === "1" || extra.worldMock === "true",
};
