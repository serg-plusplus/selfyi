import type { IDKitResult } from "@worldcoin/idkit-core";
import type { Env } from "../env";

const VERIFY_API_BASE: Record<string, string> = {
  production: "https://developer.world.org",
  staging: "https://staging-developer.worldcoin.org",
};

export interface VerifyVerdict {
  ok: boolean;
  code: string | null;
}

export async function verifyProofV4(env: Env, result: IDKitResult): Promise<VerifyVerdict> {
  const base = VERIFY_API_BASE[env.WORLD_ENV] ?? VERIFY_API_BASE.production;
  const res = await fetch(`${base}/api/v4/verify/${env.WORLD_RP_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "selfie-backend/0.1 (Cloudflare Workers)",
      Accept: "application/json",
    },
    body: JSON.stringify(result),
  });
  const text = await res.text();
  interface VerifyResponse {
    success?: boolean;
    code?: string;
    detail?: string;
    message?: string;
  }
  let json: VerifyResponse | null = null;
  try {
    json = JSON.parse(text) as VerifyResponse;
  } catch {
  }

  if (res.ok && json?.success === true) return { ok: true, code: null };

  const code = json?.code ?? json?.message ?? `http_${res.status}`;
  console.error("worldid: verify rejected", {
    status: res.status,
    code,
    detail: json?.detail ?? text.slice(0, 300),
    rpId: env.WORLD_RP_ID,
    worldEnv: env.WORLD_ENV,
    protocol: "protocol_version" in result ? result.protocol_version : "?",
  });
  return { ok: false, code };
}

export function extractNullifier(result: IDKitResult): string | null {
  if ("session_id" in result && result.session_id !== undefined) {
    const item = result.responses[0];
    return item?.session_nullifier?.[0] ?? null;
  }
  const item = result.responses[0];
  if (!item) return null;
  return "nullifier" in item ? (item.nullifier ?? null) : null;
}
