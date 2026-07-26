import { config } from "./config";

export function hlsUrlFor(playbackId: string, signedToken?: string): string {
  const base = `https://customer-${config.streamCustomerCode}.cloudflarestream.com/${playbackId}/manifest/video.m3u8`;
  return signedToken ? `${base}?token=${signedToken}` : base;
}
