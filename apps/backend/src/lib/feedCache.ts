import { FEED_CACHE_TTL_SEC, type FeedPage } from "@selfie/common";
import type { Env } from "../env";

const KEY = "feed:v1:first-page";

export async function getCachedFirstPage(env: Env): Promise<FeedPage | null> {
  const raw = await env.KV.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FeedPage;
  } catch {
    return null;
  }
}

export async function setCachedFirstPage(env: Env, page: FeedPage): Promise<void> {
  await env.KV.put(KEY, JSON.stringify(page), { expirationTtl: FEED_CACHE_TTL_SEC });
}

export async function invalidateFeedCache(env: Env): Promise<void> {
  await env.KV.delete(KEY);
}
