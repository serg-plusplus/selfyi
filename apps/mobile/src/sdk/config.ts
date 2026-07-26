import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function normalizeCustomerCode(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/^customer-/, "")
    .replace(/\.cloudflarestream\.com.*$/, "");
}

export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? "http://localhost:8787",
  streamCustomerCode: normalizeCustomerCode(extra.streamCustomerCode),
  worldMock: extra.worldMock === "1" || extra.worldMock === "true",
};
