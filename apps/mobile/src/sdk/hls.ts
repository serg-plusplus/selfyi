import { config } from "./config";

/**
 * Build the Cloudflare Stream HLS manifest URL from a playback id (mobile spec
 * §7). Private/DM videos pass a signed `token`.
 */
export function hlsUrlFor(playbackId: string, signedToken?: string): string {
  const base = `https://customer-${config.streamCustomerCode}.cloudflarestream.com/${playbackId}/manifest/video.m3u8`;
  return signedToken ? `${base}?token=${signedToken}` : base;
}
