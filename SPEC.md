# Selfie — Specification

A humans-only, TikTok-style video app. Every user passes a **World ID Selfie
Check** before seeing anything. The feed is simply *all videos, newest →
oldest*. Instead of likes/comments/DMs there is exactly one social primitive:
**Connect** — a mutual-approval handshake that reveals Instagram/WhatsApp
contacts.

This document is the authoritative spec for the app. Decisions referenced as
"(D#)" were locked in the planning interview.

---

## 1. Product scope

### In scope

| # | Feature |
|---|---------|
| 1 | **World ID gate** (D1): Selfie Check via IDKit deep link → World App → proof → server-side verify. No proof → no app. |
| 2 | **Onboarding** (D3): one screen, one field — pick a unique `@username`. Avatar = generated initials placeholder. |
| 3 | **Feed** (D13): vertical TikTok pager (swipe up/down, snap, autoplay, loop, tap-to-pause, mute toggle). All `ready` videos, newest → oldest, cursor pagination. **No pull-to-refresh.** |
| 4 | **Video overlay**: `@username` bottom-left → tap → public profile. Nothing else. |
| 5 | **Record FAB** (D6): always visible bottom-right on all tabs. Opens **native iOS camera** (`expo-image-picker`, `videoMaxDuration: 30`). Upload → Stream direct creator upload. FAB spins while uploading; fail → `alert(error)`; success → toast "Published" (tap → own profile). |
| 6 | **Profiles**: own (avatar, handle, contacts view/edit, logout, 3-col video grid with "Processing" badges) and public (grid + Connect button). |
| 7 | **Connect** (D8/D9): request → addressee sees it in Inbox → Approve / Decline / ignore. Approve **auto-reveals both sides' contacts** (if entered). Decline is silent; requester's button resets to "Connect" and re-request re-pends the same pair row (fresh timestamp, top of inbox). |
| 8 | **Share contact**: popup to enter Instagram + WhatsApp usernames **once** (stored on profile, editable from own profile). |
| 9 | **Inbox**: all connections, newest activity first. Incoming pending → Approve/Decline. Approved → tap → other person's contacts (Instagram opens `instagram.com/<handle>`). Refreshes on tab focus. |
| 10 | **Mock data** (D7/D12): 10 seeded users ("personas") × ~10 vertical Pexels videos = 100 videos, staggered `created_at`. Mock users are "alive": incoming connects auto-approve after 5–30 s; their contacts are pre-filled with real popular Instagram handles. |
| 11 | **Video detail**: full-screen player from any grid; owner can delete. |

### Explicitly out of scope (removed from the parent project)

Likes, comments (incl. video comments), follows, DMs, push notifications,
notification inbox, view-counter Durable Objects, moderation (Workers AI),
geo ranking, re-engagement crons, queues, Google/Apple OAuth, email, display
names, captions, avatars upload, settings screens, pull-to-refresh, MMKV,
VisionCamera, Reanimated. (One DO exists: `WorldIdSession` for the World ID
bridge — backend-only, see §3.)

Known accepted risks: unlimited connect re-requests (spam vector);
`WORLD_VERIFY_MODE=mock` must never ship in a production Worker.

---

## 2. Architecture

```
┌───────────────────────────┐      import type { AppRouter }
│  apps/mobile (Expo)        │ ───────────────────────────────────┐
│  expo-router · tRPC client │                                     │
│  IDKit (World ID session)  │                                     ▼
└─────────────┬──────────────┘        ┌──────────────────────────────────┐
              │ HTTPS /trpc (Bearer JWT)│  packages/common                  │
              ▼                        │  zod schemas · types · constants  │
┌───────────────────────────┐  uses   │  (single source of truth)         │
│  apps/backend (CF Worker)  │◄───────►└──────────────────────────────────┘
│  Hono shell → tRPC          │
│  ├── D1 (users/videos/conn) │        ┌──────────────┐
│  ├── KV (feed page-1 cache) │───────►│ CF Stream     │ upload/transcode/HLS
│  └── /api/webhooks/stream   │◄───────│ (webhook)     │
└─────────────┬──────────────┘        └──────────────┘
              ▼
   World ID verify API  (POST /api/v2/verify/{app_id})
```

- **Monorepo** (D4): pnpm + Turborepo. `packages/common` holds every payload
  schema; backend uses them for input/output validation, mobile for response
  validation. `AppRouter` type flows backend → mobile with zero codegen.
- **D1** is the primary store; **KV** caches only the hot cursor-less first
  feed page (30 s TTL, invalidated on publish/delete).
- **Stream**: direct creator uploads (bytes never touch the Worker), HLS
  playback via `customer-<code>.cloudflarestream.com/<uid>/manifest/video.m3u8`,
  HMAC-verified webhook flips `processing → ready`.

## 3. Auth model (D1, D3 — World ID session flow, backend-driven bridge)

Invariants (World ID integration spec §0): the RP signing key exists only as
a Worker secret; proofs are verified only server-side; the client performs
**zero** World ID crypto — no WebCrypto, no WASM, no native modules, no
World packages at all (`expo-linking` is the entire client dependency).

```
Expo app                CF Worker                    World bridge / World App
   |-- worldid.createSession -->|                              |
   |                     DO WorldIdSession:                    |
   |                     signRequest (RP key, local)           |
   |                     IDKit.request().preset(              |
   |                       selfieCheckLegacy({signal})) -----> |  bridge request
   |<-- {sessionId, connectorURI}                              |
   |-- Linking.openURL(connectorURI) ------------------------> |  Selfie Check in World App
   |-- worldid.getSession (every 2s) -->|                      |
   |                     DO alarm polls bridge every 2s ------>|
   |                     confirmed → POST api/v4/verify/{rp_id}|
   |<-- {state:'confirmed', token, user} (JWT minted here)     |
```

1. `worldid.createSession` → the **WorldIdSession Durable Object** signs the
   RP context (`signRequest` from `@worldcoin/idkit-core/signing` — pure JS)
   and creates `IDKit.request({…, allow_legacy_proofs: true}).preset(
   selfieCheckLegacy({ signal: sessionId }))`. The live request object (it
   holds the bridge AES key) stays in DO memory; state persists in DO storage.
2. Client opens `connectorURI` → World App runs the Selfie Check (enrollment
   for new users — there is no in-app selfie SDK).
3. Client polls `worldid.getSession` every 2 s (5-min client timeout); a
   deep-link return (`return_to` = client-supplied `Linking.createURL`)
   pokes an immediate poll. The DO also self-polls via a 2 s alarm (15-min
   session TTL) — variant B of the integration spec §4, chosen because
   `idkit-core` cannot reconstruct a request from `(requestId, bridgeKey)`.
4. On bridge confirmation the DO POSTs the **raw** IDKit result to
   `https://developer.world.org/api/v4/verify/{rp_id}`; success ⇔
   `success: true`. The nullifier is extracted (v3 `responses[0].nullifier`;
   selfieCheckLegacy is a v3 preset).
5. `worldid.getSession` then upserts the user by nullifier (UNIQUE — one
   human = one account; a known nullifier is a *returning login*, adapted
   from spec §3.5 because World ID **is** the login here — no userId exists
   pre-auth) and returns `{state:'confirmed', token, user}`. JWT →
   SecureStore; `onboarded=false` routes to the handle screen.
6. Errors (spec §7): user rejection → `failed` with bridge error code;
   expired RP signature → recreate session; DO eviction → `session_lost` →
   client retries; client network errors don't change state.
7. Dev loop: `EXPO_PUBLIC_WORLD_MOCK=1` + `WORLD_VERIFY_MODE=mock` —
   createSession stores a per-device fake nullifier in KV, getSession
   confirms instantly. Staging: `WORLD_ENV=staging` + staging `app_id`/`rp_id`.

Selfie Check properties (spec §6): credential ID 11, issuer Tools for
Humanity, **Beta**, sybil resistance "some" (face similarity), credential
valid 90 days. Anti-mass-signup gate, not KYC.

## 4. Data model (D1 database)

See `apps/backend/migrations/0001_init.sql` (authoritative DDL).

- **users**: `id` (ULID), `world_nullifier` UNIQUE, `handle` UNIQUE,
  `avatar_url`, `instagram`, `whatsapp`, `is_mock`, `onboarded`, timestamps.
- **videos**: `id` (ULID = feed cursor), `author_id`, `stream_uid` UNIQUE,
  `playback_id`, `thumbnail_url`, `duration_sec`,
  `status ∈ {processing, ready}`, `created_at`, `deleted_at` (soft delete).
- **connections**: one row per user pair — `pair_key` UNIQUE
  (`min(id):max(id)`), `requester_id`/`addressee_id` give direction,
  `status ∈ {pending, approved, declined}`, `auto_approve_at` (mock lazy
  auto-approve), timestamps. Re-request flips the same row back to `pending`.

## 5. API surface (tRPC)

| Procedure | Auth | Purpose |
|---|---|---|
| `worldid.createSession` | public | create bridge session → `{sessionId, connectorURI}` |
| `worldid.getSession` | public | poll state; on confirmed → `{token, user}` (login) |
| `auth.completeOnboarding` | JWT | claim `@handle` (CONFLICT if taken) |
| `auth.me` | JWT | session bootstrap |
| `auth.updateContacts` | JWT | store Instagram/WhatsApp (once, editable) |
| `feed.main` | JWT | all ready videos, newest first (KV-cached page 1) |
| `feed.user` | JWT | one user's videos (owner sees `processing` too) |
| `videos.getUploadUrl` | JWT | Stream direct upload + `processing` row |
| `videos.get` / `videos.delete` | JWT | detail / owner soft-delete |
| `users.getByHandle` / `getById` | JWT | public profile + viewer-relative connection state |
| `connections.send` | JWT | connect request (mock addressee → `auto_approve_at` = now + 5–30 s) |
| `connections.inbox` | JWT | my connections, newest activity first (runs lazy mock auto-approve) |
| `connections.respond` | JWT | approve / decline (addressee only) |
| `POST /api/webhooks/stream` | HMAC | Stream "ready" → finalize video |

Connect button state machine (from `users.get*` → `connection`):
`null` → **Connect** · `pending/outgoing` → **Requested** (disabled) ·
`pending/incoming` → **Respond in Inbox** · `approved` → **Connected ✓**.
Declined rows are returned as `null` (invisible to the requester, D9).

## 6. Mobile app structure

```
app/
  verify.tsx          # World ID gate (entry)
  onboarding.tsx      # @handle picker (once)
  (tabs)/feed|inbox|profile + _layout (3 tabs + RecordFab overlay)
  user/[handle].tsx   # public profile + Connect
  video/[id].tsx      # detail + owner delete
src/sdk/              # UI-agnostic SDK: trpc, auth (JWT+World ID), upload,
                      # queries, uiStore (mute/FAB/toast)
src/components/       # VideoPlayer, FeedList (pager), VideoOverlay, RecordFab,
                      # ToastHost, ShareContactModal, AuthGate, Avatar, …
```

**Zero custom native modules** (D2, revised — the app must run in **Expo
Go**): `expo-video` (player), `expo-image-picker` (native system camera),
`expo-secure-store` (JWT), everything else pure JS. World ID needs **no
client packages at all**: the whole bridge/crypto flow lives in the backend
Durable Object (§3); the client only calls `worldid.createSession`, opens
`connectorURI` via `expo-linking`, and polls `worldid.getSession`. The gate
UI states (`idle → opening → awaiting`) are exposed by `useAuth().gateState`.

## 7. Distribution (D2, revised — Expo Go + EAS Update)

- **Daily dev**: `expo start` → scan QR → runs in Expo Go on the phone;
  hot reload over Metro/Wi-Fi. No Xcode, no prebuild.
- **Sharing**: `eas update --branch main` publishes the JS bundle; testers
  open it in Expo Go via a `qr.expo.dev/eas-update` QR
  (`runtimeVersion=exposdk:<SDK>`, `channel=main`). No Apple/Google accounts,
  no UDIDs. Caveats: update links are public; env (`EXPO_PUBLIC_*`) is baked
  in at publish time; `runtimeVersion` policy must stay `sdkVersion`.
- Fallback if a native module ever becomes unavoidable: `expo prebuild` +
  EAS Build ad-hoc (100 UDIDs, org name hidden; avoid TestFlight if the
  Apple org must stay private).
- Placeholders for all ids live in `ENVIRONMENT.md`; steps in `TODO.md`.

## 8. Seed (D7/D12)

`apps/backend/scripts/seed.ts`: Pexels API (portrait, ≤30 s, people/lifestyle
queries per persona) → **Stream copy-from-URL** (no local downloads) → wait for
transcode → generate `seed/seed.sql` (10 users + up to 100 videos, hourly
staggered `created_at`, ULIDs minted to match) → apply with
`wrangler d1 execute`. Mock contacts: real popular Instagram handles
(@cristiano, @zendaya, …), fake WhatsApp names.

## 9. Acceptance checklist

- [ ] Fresh install → verify screen; cannot reach feed without passing the gate.
- [ ] First login → handle screen; taken handle → friendly error; then feed.
- [ ] Feed: full-screen snap paging, newest first, autoplay/loop, tap-pause,
      mute persists across cards, infinite scroll to the oldest video.
- [ ] Tap `@handle` → public profile grid; Connect → "Requested"; mock user
      approves in ≤30 s → Inbox shows "connected"; tap → their real Instagram
      opens in browser.
- [ ] Incoming mock requests appear in Inbox (seeded); Approve reveals
      contacts both ways; Decline hides the row and their profile shows
      "Connect" again.
- [ ] Share contact popup: entered once, shown on own profile, editable.
- [ ] FAB → native camera (30 s hard stop) → spinner → toast "Published" →
      tap → own profile; video shows "Processing", flips to ready after the
      webhook, then appears at the top of the feed.
- [ ] Owner can delete a video; it disappears from feed + profile.
- [ ] Relaunch: JWT persists, gate skipped.
- [ ] `pnpm typecheck` green across all three packages; `wrangler deploy
      --dry-run` bundles.
