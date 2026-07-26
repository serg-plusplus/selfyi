import { IDKit, selfieCheckLegacy, type IDKitRequest } from "@worldcoin/idkit-core";
import { signRequest } from "@worldcoin/idkit-core/signing";
import type { Env } from "../env";
import { extractNullifier, verifyProofV4 } from "../services/worldid";

interface SessionRecord {
  sessionId: string;
  state: "pending" | "confirmed" | "failed";
  nullifierHash?: string;
  error?: string;
  createdAt: number;
}

const POLL_INTERVAL_MS = 2_000;
const SESSION_TTL_MS = 15 * 60 * 1000;

export class WorldIdSession {
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

  private async start(sessionId: string, returnTo?: string): Promise<Response> {
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
      allow_legacy_proofs: true,
      environment: this.env.WORLD_ENV === "staging" ? "staging" : "production",
      return_to: returnTo ?? `${this.env.APP_SCHEME}://worldid/callback`,
    }).preset(selfieCheckLegacy({ signal: sessionId }));

    this.request = request;
    const record: SessionRecord = { sessionId, state: "pending", createdAt: Date.now() };
    await this.state.storage.put("record", record);
    await this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);

    return Response.json({ connectorURI: request.connectorURI });
  }

  private async status(): Promise<Response> {
    let record = await this.state.storage.get<SessionRecord>("record");
    if (!record) return Response.json({ error: "not found" }, { status: 404 });

    if (record.state === "pending") {
      await this.pollOnce();
      record = (await this.state.storage.get<SessionRecord>("record")) ?? record;
    }

    return Response.json({
      state: record.state,
      error: record.error ?? null,
      nullifierHash: record.nullifierHash ?? null,
    });
  }

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
        await this.finish({ ...record, state: "failed", error: "session_lost" });
        return;
      }

      const status = await this.request.pollOnce();
      if (status.type === "confirmed" && status.result) {
        const verdict = await verifyProofV4(this.env, status.result);
        const nullifier = verdict.ok ? extractNullifier(status.result) : null;
        if (verdict.ok && nullifier) {
          await this.finish({ ...record, state: "confirmed", nullifierHash: nullifier });
        } else {
          const error = verdict.ok
            ? "verification_failed:no_nullifier"
            : `verification_failed:${verdict.code}`;
          await this.finish({ ...record, state: "failed", error });
        }
      } else if (status.type === "failed") {
        await this.finish({ ...record, state: "failed", error: status.error ?? "failed" });
      }
    } catch {
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
