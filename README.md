# Selfie

Humans-only TikTok-style video app: **World ID Selfie Check** gate → vertical
video feed → record with the native camera → **Connect** with people →
exchange Instagram/WhatsApp after mutual approval.

Full product/technical spec: **[SPEC.md](./SPEC.md)** · env placeholders:
**[ENVIRONMENT.md](./ENVIRONMENT.md)** · agent skills for this repo:
**[SKILLS.md](./SKILLS.md)**.

Stack: Cloudflare Workers + **D1** + **KV** + **Stream** (backend, Hono+tRPC) ·
Expo / React Native (mobile) · `packages/common` zod schemas as the single
source of truth (end-to-end types, zero codegen).

---

## Prerequisites

- Node 20+, pnpm 10 (`corepack enable`)
- A Cloudflare account with a **Stream subscription** ($5/mo minimum)
- A **World ID Developer Portal** app (https://developer.worldcoin.org)
- A free **Pexels API key** (https://www.pexels.com/api/) — for seeding only
- The **Expo Go** app on your iPhone — no Xcode, no Apple/Google dev accounts

> Step-by-step onboarding checklist: **[TODO.md](./TODO.md)**.

## 1. Install & typecheck

```bash
pnpm install
pnpm build        # builds @selfie/common + emits the backend AppRouter types
pnpm typecheck    # all three packages
```

## 2. Cloudflare resources (once)

```bash
cd apps/backend
pnpm exec wrangler login
pnpm exec wrangler d1 create selfie-db        # paste database_id into wrangler.toml
pnpm exec wrangler kv namespace create KV     # paste id into wrangler.toml
```

Fill the rest of `wrangler.toml` `[vars]` (`STREAM_ACCOUNT_ID`,
`STREAM_CUSTOMER_CODE`, `WORLD_APP_ID`, `WORLD_ACTION`) and set secrets:

```bash
pnpm exec wrangler secret put JWT_SECRET
pnpm exec wrangler secret put STREAM_API_TOKEN
pnpm exec wrangler secret put STREAM_WEBHOOK_SECRET
```

Create the Stream webhook (Dashboard → Stream → Webhooks, or API) pointing to
`https://<your-worker>/api/webhooks/stream` — it prints the signing secret.

Apply the schema:

```bash
pnpm --filter @selfie/backend db:migrate:local    # local dev DB
pnpm --filter @selfie/backend db:migrate:remote   # production D1
```

## 3. Seed mock data (10 users, 100 videos)

```bash
cp apps/backend/dev.vars.example apps/backend/.dev.vars   # fill PEXELS_API_KEY etc.
pnpm --filter @selfie/backend seed                 # Pexels → Stream → seed/seed.sql
pnpm --filter @selfie/backend seed:apply:local     # and/or seed:apply:remote
```

## Running modes — read this first

| | Dev mode (this section) | Published mode, **24/7** (§5) |
|---|---|---|
| JS served from | your Mac (Metro dev server) | **Expo CDN** (`u.expo.dev`) — laptop can be off |
| Backend | local `wrangler dev` or deployed Worker | deployed Worker (Cloudflare, always on) |
| QR code | temporary — alive while `expo start` runs | **permanent** — the `qr.expo.dev` QR always serves the latest update in the channel |
| Use for | daily development, hot reload | your phone + testers, demos, "just works" |

The laptop is only ever needed (a) for dev mode and (b) for the moment you
run `eas update` to publish a new version. After that the same permanent QR
keeps working — new publishes swap what it opens.

## 4. Run it (Expo Go — no prebuild, no native builds)

```bash
pnpm --filter @selfie/backend dev     # local Worker on :8787
cp apps/mobile/env.development.example apps/mobile/.env.development
# → set EXPO_PUBLIC_API_BASE_URL to http://<your-mac-LAN-ip>:8787 for a real device
pnpm --filter @selfie/mobile start    # scan the QR with your iPhone → opens in Expo Go
```

The app has **zero custom native modules** by design: `expo-video` player,
`expo-image-picker` native camera — and **zero World ID packages on the
client**: the whole IDKit bridge flow (RP signing, session, polling, proof
verification) runs in a Durable Object on the Worker. The phone only opens
`connectorURI` and polls session status (see SPEC §3).

### Dev without World App

Set `EXPO_PUBLIC_WORLD_MOCK=1` (mobile) + `WORLD_VERIFY_MODE=mock` (backend
`.dev.vars`). The gate button becomes "Continue (dev mock)". For a real
staging flow, create a **staging** app in the World ID portal and use
https://simulator.worldcoin.org.

## 5. Share with testers (Expo Go + EAS Update, all free)

```bash
npm i -g eas-cli && eas login          # neutral Expo account (name shows in URLs)
cd apps/mobile && eas init             # writes EAS_PROJECT_ID
# point EXPO_PUBLIC_API_BASE_URL at the DEPLOYED Worker first — env is baked in
eas update --branch main --message "eas"
```

Tester link/QR (opens straight in Expo Go):

```
https://qr.expo.dev/eas-update?projectId=<EAS_PROJECT_ID>&runtimeVersion=exposdk:57.0.0&channel=main
```

Testers install Expo Go, scan, done. **This QR works 24/7 with your laptop
off**: the bundle is hosted on Expo's CDN and the backend is a deployed
Cloudflare Worker. The QR itself is permanent — every new `eas update
--branch main` replaces what it opens, no re-sharing needed. Prerequisites
for "laptop-off" mode: backend deployed (§2), remote D1 migrated + seeded
(§3), and `EXPO_PUBLIC_API_BASE_URL` pointing at the deployed Worker at
publish time. No Apple/Google accounts, no UDIDs, no builds.

## Layout

```
packages/common/     # zod schemas, enums, constants, ULID
apps/backend/        # CF Worker: trpc/ (auth, feed, videos, users, connections),
                     # services/ (jwt, stream, worldid), http/ (stream webhook),
                     # migrations/, scripts/seed.ts
apps/mobile/         # Expo app: app/ (verify, onboarding, tabs, user, video),
                     # src/sdk/ (trpc, auth, worldid, upload, queries, store),
                     # src/components/ (player, pager, FAB, toast, modals)
```
