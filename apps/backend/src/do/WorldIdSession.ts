import { IDKit, selfieCheckLegacy, type IDKitRequest } from "@worldcoin/idkit-core";
import { signRequest } from "@worldcoin/idkit-core/signing";
import type { Env } from "../env";
import { extractNullifier, verifyProofV4 } from "../services/worldid";

/** SPEC §3.2 — persisted session state (survives DO restarts). */
interface SessionRecord {
  sessionId: string;
  state: "pending" | "confirmed" | "failed";
  nullifierHash?: string;
  error?: string;
  createdAt: number;
}

const POLL_INTERVAL_MS = 2_000;
/** SPEC §3.2 — session TTL 15 min. */
const SESSION_TTL_MS = 15 * 60 * 1000;

/**
 * World ID bridge session — SPEC §4 variant B (Durable Object).
 *
 * Why a DO: `idkit-core` cannot reconstruct an `IDKitRequest` from
 * `(requestId, bridgeKey)` — the AES session key lives inside the request
 * object. A DO is single-instanced, so it can hold the live request in memory
 * while `alarm()` polls the bridge every 2 s and persists state transitions
 * to DO storage. Invariants (SPEC §0): the RP signing key and all bridge
 * crypto stay inside this Worker; the client only opens a URL and reads state.
 *
 * If the DO is evicted mid-flow (rare within 15 min), the in-memory request
 * is lost → the session fails with `session_lost` and the client recreates it.
 */
export class WorldIdSession {
  /** Live bridge request — in-memory only (holds the AES session key). */
  private request: IDKitRequest | null = null;
  private polling = false;

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/start") {
      const body = (await req.json()) as { sessionId: string; returnTo?: string };
      return this.start(body.sessionId, body.returnTo);
    }
    if (req.method === "GET" && url.pathname === "/status") {
      return this.status();
    }
    return Response.json({ error: "not found" }, { status: 404 });
  }

  /** SPEC §3.3 POST /worldid/session — sign RP context, create bridge request. */
  private async start(sessionId: string, returnTo?: string): Promise<Response> {
    // RP signature: short-lived, computed with the Worker-only signing key.
    const rpSig = signRequest({
      signingKeyHex: this.env.WORLD_RP_SIGNING_KEY,
      action: this.env.WORLD_ACTION,
    });

    const request = await IDKit.request({
      app_id: this.env.WORLD_APP_ID as `app_${string}`,
      action: this.env.WORLD_ACTION,
      rp_context: {
        rp_id: this.env.WORLD_RP_ID,
        nonce: rpSig.nonce,
        created_at: rpSig.createdAt,
        expires_at: rpSig.expiresAt,
        signature: rpSig.sig,
      },
      // selfieCheckLegacy is a v3 preset — legacy proofs MUST be allowed.
      allow_legacy_proofs: true,
      environment: this.env.WORLD_ENV === "staging" ? "staging" : "production",
      return_to: returnTo ?? `${this.env.APP_SCHEME}://worldid/callback`,
      // Signal binds the proof to THIS session (adaptation: no userId exists
      // pre-auth — World ID *is* the login; see SPEC §3).
    }).preset(selfieCheckLegacy({ signal: sessionId }));

    this.request = request;
    const record: SessionRecord = { sessionId, state: "pending", createdAt: Date.now() };
    await this.state.storage.put("record", record);
    await this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);

    return Response.json({ connectorURI: request.connectorURI });
  }

  /** SPEC §3.3 GET /worldid/session/:id — read state; opportunistic poll. */
  private async status(): Promise<Response> {
    let record = await this.state.storage.get<SessionRecord>("record");
    if (!record) return Response.json({ error: "not found" }, { status: 404 });

    if (record.state === "pending") {
      // Client-driven poke (SPEC §4-A spirit): poll once on demand too, so a
      // deep-link return reflects instantly instead of waiting for the alarm.
      await this.pollOnce();
      record = (await this.state.storage.get<SessionRecord>("record")) ?? record;
    }

    return Response.json({
      state: record.state,
      error: record.error ?? null,
      nullifierHash: record.nullifierHash ?? null,
    });
  }

  /** Bridge poll every 2 s while pending (SPEC §4-B). */
  async alarm(): Promise<void> {
    await this.pollOnce();
    const record = await this.state.storage.get<SessionRecord>("record");
    if (record?.state === "pending") {
      await this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
    }
  }

  private async pollOnce(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      const record = await this.state.storage.get<SessionRecord>("record");
      if (!record || record.state !== "pending") return;

      if (Date.now() - record.createdAt > SESSION_TTL_MS) {
        await this.finish({ ...record, state: "failed", error: "timeout" });
        return;
      }
      if (!this.request) {
        // DO restarted; the in-memory bridge key is gone. Client recreates.
        await this.finish({ ...record, state: "failed", error: "session_lost" });
        return;
      }

      const status = await this.request.pollOnce();
      if (status.type === "confirmed" && status.result) {
        // SPEC §3.4 — verification happens HERE, never on the client.
        const verdict = await verifyProofV4(this.env, status.result);
        const nullifier = verdict.ok ? extractNullifier(status.result) : null;
        if (verdict.ok && nullifier) {
          await this.finish({ ...record, state: "confirmed", nullifierHash: nullifier });
        } else {
          // Propagate the portal's code so the client alert / logs say WHY
          // (e.g. verification_failed:max_verifications_reached).
          const error = verdict.ok
            ? "verification_failed:no_nullifier"
            : `verification_failed:${verdict.code}`;
          await this.finish({ ...record, state: "failed", error });
        }
      } else if (status.type === "failed") {
        await this.finish({ ...record, state: "failed", error: status.error ?? "failed" });
      }
      // waiting_for_connection / awaiting_confirmation → stay pending
    } catch {
      // transient bridge/network error — keep pending, next tick retries
    } finally {
      this.polling = false;
    }
  }

  private async finish(record: SessionRecord): Promise<void> {
    this.request = null;
    await this.state.storage.put("record", record);
    await this.state.storage.deleteAlarm();
  }
}
