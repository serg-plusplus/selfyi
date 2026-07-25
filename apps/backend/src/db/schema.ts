import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** ISO-8601 UTC timestamp column (TEXT in SQLite). */
const ts = (name: string) =>
  text(name)
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);

// ---------------------------------------------------------------------------
// users — created on first successful World ID verification.
// ---------------------------------------------------------------------------
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // ULID
    /** World ID nullifier hash — the stable anonymous identity. UNIQUE = replay/Sybil guard. */
    worldNullifier: text("world_nullifier").notNull().unique(),
    handle: text("handle").notNull().unique(),
    avatarUrl: text("avatar_url"),
    /** contact details, entered once via the "Share contact" popup */
    instagram: text("instagram"),
    whatsapp: text("whatsapp"),
    /** seeded demo users: content authors + auto-approve incoming connects */
    isMock: integer("is_mock").notNull().default(0),
    /** 0 until the user picked a handle on the onboarding screen */
    onboarded: integer("onboarded").notNull().default(0),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("idx_users_handle").on(t.handle)],
);

// ---------------------------------------------------------------------------
// videos — one row per Stream upload. ULID ids double as the feed cursor.
// ---------------------------------------------------------------------------
export const videos = sqliteTable(
  "videos",
  {
    id: text("id").primaryKey(), // ULID (also the pagination cursor)
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    streamUid: text("stream_uid").notNull().unique(),
    playbackId: text("playback_id").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    durationSec: real("duration_sec"),
    /** 'processing' until the Stream webhook flips it to 'ready' */
    status: text("status").notNull().default("processing"),
    createdAt: ts("created_at"),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_videos_feed").on(t.status, t.id),
    index("idx_videos_author").on(t.authorId, t.id),
  ],
);

// ---------------------------------------------------------------------------
// connections — one row per user pair (canonical pair key), direction via
// requester_id. Re-requests after decline reuse the row (status → pending).
// ---------------------------------------------------------------------------
export const connections = sqliteTable(
  "connections",
  {
    id: text("id").primaryKey(), // ULID
    /** canonical `${min(idA,idB)}:${max(idA,idB)}` — one row per pair */
    pairKey: text("pair_key").notNull(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 'pending' | 'approved' | 'declined' */
    status: text("status").notNull().default("pending"),
    /** set when the addressee is a mock user: lazily auto-approve after this time */
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
