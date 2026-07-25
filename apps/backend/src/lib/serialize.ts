import type { Me, User, Video, VideoStatus } from "@selfie/common";
import type { UserRow, VideoRow } from "../db/schema";

export type UserPublicFields = Pick<
  UserRow,
  "id" | "handle" | "avatarUrl" | "isMock" | "createdAt"
>;

export function toUserApi(u: UserPublicFields): User {
  return {
    id: u.id,
    handle: u.handle,
    avatar_url: u.avatarUrl,
    is_mock: u.isMock === 1,
    created_at: u.createdAt,
  };
}

export function toMeApi(u: UserRow): Me {
  return {
    ...toUserApi(u),
    onboarded: u.onboarded === 1,
    instagram: u.instagram,
    whatsapp: u.whatsapp,
  };
}

export function toVideoApi(v: VideoRow, author: UserPublicFields): Video {
  return {
    id: v.id,
    author: toUserApi(author),
    playback_id: v.playbackId,
    thumbnail_url: v.thumbnailUrl,
    duration_sec: v.durationSec,
    status: v.status as VideoStatus,
    created_at: v.createdAt,
  };
}
