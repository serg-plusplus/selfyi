-- Selfie MVP — authoritative D1 (SQLite) schema.
-- Apply: pnpm --filter @selfie/backend db:migrate:local   (dev)
--        pnpm --filter @selfie/backend db:migrate:remote  (prod)

CREATE TABLE IF NOT EXISTS users (
    id               TEXT PRIMARY KEY,                 -- ULID
    world_nullifier  TEXT NOT NULL UNIQUE,             -- World ID nullifier hash (Sybil/replay guard)
    handle           TEXT NOT NULL UNIQUE,             -- @username
    avatar_url       TEXT,
    instagram        TEXT,                             -- shared contact (entered once)
    whatsapp         TEXT,                             -- shared contact (entered once)
    is_mock          INTEGER NOT NULL DEFAULT 0,       -- seeded demo user
    onboarded        INTEGER NOT NULL DEFAULT 0,       -- picked a handle yet?
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);

CREATE TABLE IF NOT EXISTS videos (
    id               TEXT PRIMARY KEY,                 -- ULID (feed cursor)
    author_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stream_uid       TEXT NOT NULL UNIQUE,             -- Cloudflare Stream uid
    playback_id      TEXT NOT NULL,                    -- HLS playback id (== uid)
    thumbnail_url    TEXT,
    duration_sec     REAL,
    status           TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'ready'
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_videos_feed   ON videos(status, id);
CREATE INDEX IF NOT EXISTS idx_videos_author ON videos(author_id, id);

CREATE TABLE IF NOT EXISTS connections (
    id               TEXT PRIMARY KEY,                 -- ULID
    pair_key         TEXT NOT NULL UNIQUE,             -- min(idA,idB) || ':' || max(idA,idB)
    requester_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status           TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'declined'
    auto_approve_at  TEXT,                             -- mock-addressee lazy auto-approve time
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id, updated_at);
