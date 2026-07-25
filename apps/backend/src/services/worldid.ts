import type { IDKitResult } from "@worldcoin/idkit-core";
import type { Env } from "../env";

const VERIFY_API_BASE = "https://developer.world.org";

/**
 * Server-side proof verification (SPEC §3.4): forward the RAW IDKit result —
 * no remapping — to the v4 verify endpoint. Success ⇔ `success: true`.
 */
export async function verifyProofV4(env: Env, result: IDKitResult): Promise<boolean> {
  const res = await fetch(`${VERIFY_API_BASE}/api/v4/verify/${env.WORLD_RP_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) return false;
  const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
  return json?.success === true;
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
