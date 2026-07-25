import { Hono } from "hono";
import { createDb } from "../db/client";
import type { Env } from "../env";
import { markVideoReady } from "../lib/finalize";

const enc = new TextEncoder();

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Parse Cloudflare's `Webhook-Signature: time=...,sig1=...` header. */
function parseSignatureHeader(header: string): { time: string; sig: string } | null {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  if (!parts.time || !parts.sig1) return null;
  return { time: parts.time, sig: parts.sig1 };
}

interface StreamWebhookBody {
  uid: string;
  readyToStream?: boolean;
  status?: { state?: string };
  duration?: number;
  thumbnail?: string;
  meta?: { videoId?: string; authorId?: string };
}

export const webhooks = new Hono<{ Bindings: Env }>();

/**
 * Cloudflare Stream callback. Verifies the HMAC signature, then on
 * `state == 'ready'` flips the matching video row to 'ready'.
 */
webhooks.post("/", async (c) => {
  const raw = await c.req.text();
  const header = c.req.header("webhook-signature");
  if (!header) return c.json({ error: "missing signature" }, 401);

  const parsed = parseSignatureHeader(header);
  if (!parsed) return c.json({ error: "bad signature header" }, 401);

  const expected = await hmacSha256Hex(c.env.STREAM_WEBHOOK_SECRET, `${parsed.time}.${raw}`);
  if (!timingSafeEqual(expected, parsed.sig)) {
    return c.json({ error: "invalid signature" }, 401);
  }

  const body = JSON.parse(raw) as StreamWebhookBody;
  const ready = body.readyToStream === true || body.status?.state === "ready";
  const videoId = body.meta?.videoId;

  if (ready && videoId) {
    c.executionCtx.waitUntil(
      markVideoReady(c.env, createDb(c.env), {
        videoId,
        streamUid: body.uid,
        duration: body.duration ?? null,
        thumbnail: body.thumbnail ?? null,
      }).catch((e) => console.error("markVideoReady failed", e)),
    );
  }

  return c.json({ ok: true });
});
