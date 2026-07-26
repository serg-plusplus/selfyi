# Selfie — Specification

A humans-only, TikTok-style video app. Every user passes a **World ID Selfie
Check** before seeing anything. The feed is *all videos, newest → oldest*.
Instead of likes/comments/DMs there is one social primitive: **Connect** — a
mutual-approval handshake that reveals Instagram/WhatsApp contacts.

## 1. Conventions

- **No comments in code.** Write self-explanatory code: descriptive names,
  small functions, explicit types. Anything that needs explaining belongs in
  this document, not in a comment. Exceptions: functional directives only
  (`@ts-expect-error`, `eslint-disable`).
- TypeScript end-to-end. `packages/common` holds every payload schema (zod);
  `AppRouter` types flow backend → mobile with zero codegen.
- `pnpm typecheck` must be green across all three packages before a commit.

## 2. Product scope

| # | Feature |
|---|---------|
| 1 | **World ID gate**: Selfie Check → World App → proof → server-side verify. No proof → no app. |
| 2 | **Onboarding**: one screen, one field — pick a unique `@username`. Avatar = generated initials. |
| 3 | **Feed**: vertical pager (snap, autoplay, loop, tap-to-pause). All `ready` videos, newest first, cursor pagination. No pull-to-refresh. |
| 4 | **Video overlay**: dark `@username` pill + accent `person-add` button — both tap into the public profile, where Connect happens. |
| 5 | **Record FAB**: always visible. Native camera (max 30 s) → Stream direct upload → spinner → "Published" toast. |
| 6 | **Profiles**: own (avatar, handle, contacts, logout, 3-col grid) and public (grid + Connect). |
| 7 | **Connect**: request → Inbox → Approve/Decline. Approve reveals both sides' contacts. Decline is silent. |
| 8 | **Share contact**: Instagram + WhatsApp usernames, stored on profile, editable. |
| 9 | **Inbox**: all connections, newest activity first. Refreshes on tab focus. |
| 10 | **Mock data**: 10 seeded personas × ~10 Pexels videos. Mock users auto-approve connects after 5–30 s. |
| 11 | **Video detail**: full-screen player; owner can delete. |

**Out of scope:** likes, comments, follows, DMs, push notifications,
moderation, geo ranking, OAuth, email, captions, avatar upload, settings.

**Accepted risks:** unlimited connect re-requests (spam vector);
`WORLD_VERIFY_MODE=mock` must never ship in production.

## 3. Architecture

```
apps/mobile (Expo)  ──HTTPS /trpc (Bearer JWT)──>  apps/backend (CF Worker)
     │                                                  ├── D1     users/videos/connections
     └── packages/common (zod schemas, shared types) ────┤── KV     feed page-1 cache (30 s)
                                                         ├── DO     WorldIdSession
                                                         └── Stream direct upload, HLS, webhook
```

- **D1** is the primary store. **KV** caches only the cursor-less first feed
  page, invalidated on publish/delete.
- **Stream**: direct creator uploads (bytes never touch the Worker), HLS
  playback, HMAC-verified webhook flips `processing → ready`.

## 4. Auth model — World ID

Invariants: the RP signing key exists only as a Worker secret; proofs are
verified only server-side; the client performs **zero** World ID crypto and
ships **no** World packages (`expo-linking` is the entire client dependency).

```
Expo app                     CF Worker (WorldIdSession DO)        World App
   │── worldid.createSession ──>│ signRequest + IDKit.request           │
   │<── {sessionId, connectorURI}│                                      │
   │── openURL(connectorURI) ───────────────────────────────────────────>│ Selfie Check
   │── worldid.getSession (2 s) ─>│ DO alarm polls bridge every 2 s <────│
   │                              │ confirmed → POST /api/v4/verify/{rp_id}
   │<── {state, token, user} ─────│ JWT minted here
```

1. The DO signs the RP context and creates the bridge request
   (`selfieCheckLegacy` preset, `allow_legacy_proofs: true`). The live request
   object holds the bridge AES key and stays in DO memory; state persists in
   DO storage. Session TTL 15 min.
2. The client opens `connectorURI`; World App runs the Selfie Check.
3. The client polls every 2 s; the DO also self-polls via alarm.
4. On confirmation the DO POSTs the **raw** IDKit result to the verify
   endpoint (`developer.world.org`, or `staging-developer.worldcoin.org` when
   `WORLD_ENV=staging`). Success ⇔ `success: true`.
5. The nullifier (`responses[0].nullifier`) upserts the user — UNIQUE, so one
   human = one account and a known nullifier is a returning login. JWT →
   SecureStore; `onboarded=false` routes to the handle screen.
6. Errors: user rejection → `failed` with the portal's error code; DO
   eviction → `session_lost` → client recreates.
7. Dev loop: `EXPO_PUBLIC_WORLD_MOCK=1` + `WORLD_VERIFY_MODE=mock` skips
   World App entirely.

**Selfie Check**: credential ID 11, issuer Tools for Humanity, Beta,
valid 90 days. An anti-mass-signup gate, not KYC.

### Worker runtime notes

- `enable_nodejs_process_v2` compat flag is required — idkit-server's
  environment check reads `process.versions.node`.
- The verify request must send a `User-Agent`; the portal's WAF 403s
  UA-less requests (Workers `fetch` sends none by default).
- IDKit's WASM cannot self-load on Workers (`import.meta.url` is empty). It is
  imported as a module and injected via a patch — see
  `patches/@worldcoin__idkit-core@*.patch` and `src/idkit-wasm.ts`.

## 5. Data model

Authoritative DDL: `apps/backend/migrations/0001_init.sql`.

- **users**: `id` (ULID), `world_nullifier` UNIQUE, `handle` UNIQUE,
  `avatar_url`, `instagram`, `whatsapp`, `is_mock`, `onboarded`.
- **videos**: `id` (ULID = feed cursor), `author_id`, `stream_uid` UNIQUE,
  `playback_id`, `thumbnail_url`, `duration_sec`,
  `status ∈ {processing, ready}`, `deleted_at` (soft delete).
- **connections**: one row per user pair — `pair_key` UNIQUE
  (`min(id):max(id)`), `requester_id`/`addressee_id` give direction,
  `status ∈ {pending, approved, declined}`, `auto_approve_at` (mock).

## 6. API surface (tRPC)

| Procedure | Auth | Purpose |
|---|---|---|
| `worldid.createSession` / `getSession` | public | bridge session; on confirmed → `{token, user}` |
| `auth.completeOnboarding` / `me` / `updateContacts` | JWT | handle claim, bootstrap, contacts |
| `feed.main` / `feed.user` | JWT | all ready videos / one user's videos |
| `videos.getUploadUrl` / `get` / `delete` | JWT | Stream upload, detail, owner soft-delete |
| `users.getByHandle` / `getById` | JWT | public profile + connection state |
| `connections.send` / `inbox` / `respond` | JWT | request, list, approve/decline |
| `POST /api/webhooks/stream` | HMAC | Stream "ready" → finalize video |

Connect button states: `null` → **Connect** · `pending/outgoing` →
**Requested** · `pending/incoming` → **Respond in Inbox** · `approved` →
**Connected ✓**. Declined rows are returned as `null`.

The feed overlay deliberately carries no connection state and sends nothing:
feed page 1 is KV-cached and must stay viewer-agnostic, so the `person-add`
button is an affordance that routes to the profile. If it ever needs to show
real per-viewer status, that belongs in a separate lightweight query rather
than extra fields on the cached feed payload.

## 7. Mobile app

```
app/
  index.tsx           redirect → feed
  verify.tsx          World ID gate (entry)
  onboarding.tsx      @handle picker
  (tabs)/             feed · inbox · profile + RecordFab overlay
  user/[handle].tsx   public profile + Connect
  video/[id].tsx      detail + owner delete
src/sdk/              trpc, auth, upload, queries, uiStore
src/components/       VideoPlayer, FeedList, VideoOverlay, RecordFab, …
```

**Zero custom native modules** — the app must run in **Expo Go**:
`expo-video`, `expo-image-picker`, `expo-secure-store`, `react-native-svg`;
everything else is pure JS.

### Video playback rules

The feed is the fragile part; these rules are load-bearing:

- The player lifecycle is owned by the component, not by `useVideoPlayer`:
  created with `createVideoPlayer(null)` inside a mount effect, source swapped
  via `replaceAsync`, torn down with **`pause()` then `release()`** in that
  effect's cleanup. Two reasons this cannot use the hook:
  `useVideoPlayer(url)` is keyed by source, so it silently creates a new
  native player per URL and releases the old one *without pausing it*; and its
  internal cleanup always runs before any of the component's own cleanups, so
  a pause registered in the component can only ever fire after the player is
  already released — which is why audio survived leaving a screen.
- Never create a player during render — a discarded render leaks a native
  player that plays forever and has no reference to stop it.
- Only the active card ± 1 mounts a player; other cards render their
  thumbnail. iOS allows only a few concurrent video decoders.
- Never `pause()` or seek a player whose status is not `readyToPlay` — it
  wedges the command queue and freezes the first frame.
- The active card is derived from scroll offset (`round(offsetY / height)`),
  not from viewability callbacks.
- Playback is gated on `useIsFocused()` from **expo-router** (SDK 57 dropped
  react-navigation, so `@react-navigation/native` hooks throw).

## 8. Distribution

- **Dev**: `expo start` → QR → Expo Go. No Xcode, no prebuild.
- **Sharing**: `eas update --channel main`; testers open a
  `qr.expo.dev/eas-update` link in Expo Go. `runtimeVersion` policy stays
  `sdkVersion`. `EXPO_PUBLIC_*` is baked in at publish time, so
  `EXPO_PUBLIC_API_BASE_URL` must be the deployed Worker URL.
- Both apps deploy from GitHub Actions on push to `main`; `<PLACEHOLDER>`
  tokens in `wrangler.toml` are injected from Actions secrets.

## 9. Seed

`apps/backend/scripts/seed.ts`: Pexels API → Stream copy-from-URL → wait for
transcode → generate `seed/seed.sql` (10 users + up to 100 videos, staggered
`created_at`) → apply with `wrangler d1 execute`.

## 10. Acceptance checklist

- [ ] Fresh install → verify screen; feed unreachable without passing the gate.
- [ ] First login → handle screen; taken handle → friendly error; then feed.
- [ ] Feed: snap paging, newest first, autoplay/loop, tap-pause, infinite
      scroll; swiping stops the previous video; leaving the screen stops audio.
- [ ] Tap `@handle` → public profile; Connect → "Requested"; mock user
      approves in ≤30 s → Inbox → their Instagram opens.
- [ ] Approve reveals contacts both ways; Decline hides the row.
- [ ] FAB → native camera (30 s) → toast → own profile; "Processing" flips to
      ready after the webhook, then appears at the top of the feed.
- [ ] Owner can delete a video; it disappears from feed + profile.
- [ ] Relaunch: JWT persists, gate skipped.
- [ ] `pnpm typecheck` green; `wrangler deploy --dry-run` bundles.
