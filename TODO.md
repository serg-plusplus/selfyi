# TODO — from zero to a working demo

Step-by-step checklist of everything YOU need to do (accounts, keys, ids).
The code is done and typechecks; every `<PLACEHOLDER>` below also appears in
[ENVIRONMENT.md](./ENVIRONMENT.md) with details.

> Delivery model: **Expo Go** (no Xcode, no Apple/Google dev accounts, no
> prebuild). You publish JS with EAS Update; testers open the app inside the
> free Expo Go app via a QR code.

---

## Phase 0 — Sanity check (5 min)

- [ ] Install Node 20+ and pnpm 10 (`corepack enable`)
- [ ] `pnpm install && pnpm build && pnpm typecheck` → must be green

## Phase 1 — Cloudflare backend (~30 min)

- [x] Create/log into a Cloudflare account: https://dash.cloudflare.com
- [x] Enable **Stream** (paid, $5/mo): Dashboard → Stream → subscribe
- [x] `cd apps/backend && pnpm exec wrangler login`
- [x] `pnpm exec wrangler d1 create selfie-db` → paste `database_id` into
      `wrangler.toml` (replaces `<D1_DATABASE_ID>`)
- [x] `pnpm exec wrangler kv namespace create KV` → paste id
      (replaces `<KV_NAMESPACE_ID>`)
- [x] Fill `wrangler.toml` `[vars]`:
  - `STREAM_ACCOUNT_ID` = `<CF_ACCOUNT_ID>` (Dashboard → Workers & Pages → right sidebar)
  - `STREAM_CUSTOMER_CODE` = the `customer-XXXX` code (Dashboard → Stream)
- [x] Set secrets:
  - `pnpm exec wrangler secret put JWT_SECRET` (generate: `openssl rand -base64 48`)
  - `pnpm exec wrangler secret put STREAM_API_TOKEN`
    (My Profile → API Tokens → create token with **Stream:Edit**)
  - `pnpm exec wrangler secret put STREAM_WEBHOOK_SECRET`
    (Dashboard → Stream → Webhooks → add `https://<your-worker>/api/webhooks/stream`;
    it prints the secret)
- [x] Apply schema: `pnpm --filter @selfie/backend db:migrate:local` and
      `db:migrate:remote`
- [x] Deploy: `pnpm --filter @selfie/backend deploy` → note the
      `https://selfie-backend.<you>.workers.dev` URL
- [x] Local dev config: `cp apps/backend/dev.vars.example apps/backend/.dev.vars`
      and fill the same values

## Phase 2 — World ID (~20 min; NO client work — everything is server-side)

The integration is already implemented: `WorldIdSession` Durable Object on
the Worker (RP signing → `IDKit.request().preset(selfieCheckLegacy)` →
bridge polling → v4 verify). The phone only opens a link and polls. You just
need the portal values:

- [ ] Developer Portal: https://developer.worldcoin.org → create an app →
      copy `app_id` (`<WORLD_APP_ID>`). Create a **staging** app too.
- [ ] Copy the **RP id** (`rp_…`) → `WORLD_RP_ID` in `wrangler.toml`
- [ ] Get the **RP signing key** →
      `pnpm exec wrangler secret put WORLD_RP_SIGNING_KEY` (hex; server-only,
      never ships to the client — invariant §0 of the World ID spec)
- [ ] Create an **action** named `selfie-gate` (or change `WORLD_ACTION`)
- [ ] Set `WORLD_ENV` (`staging` while testing, `production` later) — must
      match the app/rp ids' environment
- [ ] For now keep mock mode ON (`WORLD_VERIFY_MODE=mock` +
      `EXPO_PUBLIC_WORLD_MOCK=1`) — the whole app works without World ID
- [ ] Flip mock off: `WORLD_VERIFY_MODE=live` (backend) +
      `EXPO_PUBLIC_WORLD_MOCK=0` (mobile), redeploy + republish
- [ ] Smoke-test the live flow once with `wrangler dev` (the runbook item:
      idkit-core's WASM bundles fine via wrangler — verify decryption works
      end-to-end in the Workers runtime on first real proof)
- [ ] Selfie Check beta access: https://docs.world.org/world-id/credentials/11
      (credential ID 11, Beta — contact developers@toolsforhumanity.com if
      your app lacks the `selfieCheckLegacy` preset). Credential lasts 90 days

## Phase 3 — Seed 10 users / 100 videos (~20 min, mostly waiting)

- [ ] Get a free Pexels key: https://www.pexels.com/api/ → "Get Started" →
      register → instant key
- [ ] Put it in `apps/backend/.dev.vars` as `PEXELS_API_KEY`
- [ ] `pnpm --filter @selfie/backend seed` (Pexels → Stream copy → waits for
      transcode → writes `seed/seed.sql`)
- [ ] Apply: `pnpm --filter @selfie/backend seed:apply:remote` (and
      `seed:apply:local` for local dev)

## Phase 4 — Run on YOUR iPhone (10 min)

- [ ] Install **Expo Go** from the App Store (free)
- [ ] `cp apps/mobile/env.development.example apps/mobile/.env.development`
- [ ] Set `EXPO_PUBLIC_API_BASE_URL` to your deployed Worker URL
      (or `http://<your-mac-LAN-ip>:8787` when running `wrangler dev`)
- [ ] `pnpm --filter @selfie/mobile start` → scan the QR with the iPhone
      camera → opens in Expo Go

## Phase 5 — Share with testers (Expo Go, no Apple account)

- [ ] `npm i -g eas-cli && eas login` — use a **neutral** Expo account name
      (it appears in URLs)
- [ ] `cd apps/mobile && eas init` → copy the project id into
      `.env.development` as `EAS_PROJECT_ID`
- [ ] Make sure `EXPO_PUBLIC_API_BASE_URL` points at the **deployed Worker**
      (env vars are baked into the published bundle!)
- [ ] Publish: `eas update --branch main --message "eas"`
- [ ] Make a tester QR/link (targets Expo Go):
      `https://qr.expo.dev/eas-update?projectId=<EAS_PROJECT_ID>&runtimeVersion=exposdk:57.0.0&channel=main`
      (append `&format=url` to get a plain link instead of an SVG)
- [ ] Testers: install Expo Go → scan the QR → the app loads. Every new
      `eas update` reaches them on next open.
- [ ] This QR is **permanent and works 24/7 with your laptop off**: the JS
      bundle lives on Expo's CDN, the backend is the deployed Cloudflare
      Worker. Laptop is only needed at the moment you publish an update.
- [ ] Note: the update URL is public (anyone with the link can open it) and
      Expo Go shows "running in Expo Go" chrome — acceptable for an app.

## Phase 6 — Verify the app

- [ ] Walk the acceptance checklist in [SPEC.md](./SPEC.md) §9 end-to-end

---

## Known constraints of the Expo Go path (accepted)

- No custom native modules ever (that's why: `expo-video` player,
  `expo-image-picker` native camera, World ID via DOM-component fork)
- No push notifications (Inbox refreshes on focus — already the design)
- The World ID deep-link return (`selfie://verify`) becomes an `exp://` link
  inside Expo Go — your fork should use the current Linking URL
  (`Linking.createURL('verify')` handles this automatically)
- If you ever need a real standalone app later: `expo prebuild` + EAS Build
  ad-hoc — the old flow is documented in git history and ENVIRONMENT.md
