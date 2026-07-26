import type { Env } from "../env";

const CF_API = "https://api.cloudflare.com/client/v4";

interface CfResponse<T> {
  success: boolean;
  result: T;
  errors?: unknown[];
}

export interface DirectUploadParams {
  maxDurationSeconds: number;
  creator: string;
  meta: Record<string, string>;
}

export interface DirectUploadResult {
  uploadURL: string;
  uid: string;
}

export async function createDirectUpload(
  env: Env,
  params: DirectUploadParams,
): Promise<DirectUploadResult> {
  const res = await fetch(
    `${CF_API}/accounts/${env.STREAM_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STREAM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: params.maxDurationSeconds,
        requireSignedURLs: false,
        creator: params.creator,
        meta: params.meta,
      }),
    },
  );
  const json = (await res.json()) as CfResponse<{ uploadURL: string; uid: string }>;
  if (!res.ok || !json.success) {
    throw new Error(`Stream direct_upload failed: ${JSON.stringify(json.errors ?? json)}`);
  }
  return { uploadURL: json.result.uploadURL, uid: json.result.uid };
}

export async function deleteStreamVideo(env: Env, uid: string): Promise<void> {
  await fetch(`${CF_API}/accounts/${env.STREAM_ACCOUNT_ID}/stream/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${env.STREAM_API_TOKEN}` },
  });
}

export function thumbnailUrl(env: Env, uid: string, timeSec = 1): string {
  const code = env.STREAM_CUSTOMER_CODE.replace(/^(https?:\/\/)?(customer-)?/, "").replace(
    /\.cloudflarestream\.com.*$/,
    "",
  );
  return `https://customer-${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?time=${timeSec}s`;
}
