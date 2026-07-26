import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const ts = (name: string) =>
  text(name)
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    worldNullifier: text("world_nullifier").notNull().unique(),
    handle: text("handle").notNull().unique(),
    avatarUrl: text("avatar_url"),
    instagram: text("instagram"),
    whatsapp: text("whatsapp"),
    isMock: integer("is_mock").notNull().default(0),
    onboarded: integer("onboarded").notNull().default(0),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("idx_users_handle").on(t.handle)],
);

export const videos = sqliteTable(
  "videos",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    streamUid: text("stream_uid").notNull().unique(),
    playbackId: text("playback_id").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    durationSec: real("duration_sec"),
    status: text("status").notNull().default("processing"),
    createdAt: ts("created_at"),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_videos_feed").on(t.status, t.id),
    index("idx_videos_author").on(t.authorId, t.id),
  ],
);

export const connections = sqliteTable(
  "connections",
  {
    id: text("id").primaryKey(),
    pairKey: text("pair_key").notNull(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    autoApproveAt: text("auto_approve_at"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [
    uniqueIndex("connections_pair_key").on(t.pairKey),
    index("idx_connections_requester").on(t.requesterId, t.updatedAt),
    index("idx_connections_addressee").on(t.addresseeId, t.updatedAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type VideoRow = typeof videos.$inferSelect;
export type ConnectionRow = typeof connections.$inferSelect;
