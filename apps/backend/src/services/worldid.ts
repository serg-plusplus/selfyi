import type { IDKitResult } from "@worldcoin/idkit-core";
import type { Env } from "../env";

/** Staging proofs are only known to the staging Developer Portal. */
const VERIFY_API_BASE: Record<string, string> = {
  production: "https://developer.world.org",
  staging: "https://staging-developer.worldcoin.org",
};

export interface VerifyVerdict {
  ok: boolean;
  /** Portal error code (e.g. max_verifications_reached) — null on success. */
  code: string | null;
}

/**
 * Server-side proof verification (SPEC §3.4): forward the RAW IDKit result —
 * no remapping — to the v4 verify endpoint (accepts both 4.0 and legacy 3.0
 * proofs). Success ⇔ `success: true`. On rejection the portal's error code is
 * surfaced to the caller and the full response is logged (Workers Logs /
 * `wrangler tail`) for diagnosis.
 */
export async function verifyProofV4(env: Env, result: IDKitResult): Promise<VerifyVerdict> {
  const base = VERIFY_API_BASE[env.WORLD_ENV] ?? VERIFY_API_BASE.production;
  const res = await fetch(`${base}/api/v4/verify/${env.WORLD_RP_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    /* non-JSON error body — logged below */
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

/**
 * Extract the nullifier that anchors "one human = one account".
 * `selfieCheckLegacy` returns a v3 proof (`allow_legacy_proofs: true`), but we
 * also handle v4 uniqueness responses for the post-beta migration.
 */
export function extractNullifier(result: IDKitResult): string | null {
  if ("session_id" in result && result.session_id !== undefined) {
    // session proofs — not used by this app
    const item = result.responses[0];
    return item?.session_nullifier?.[0] ?? null;
  }
  const item = result.responses[0];
  if (!item) return null;
  return "nullifier" in item ? (item.nullifier ?? null) : null;
}
