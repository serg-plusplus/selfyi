# Environment & Placeholders

Every id/secret the project needs, where it lives, and how to obtain it.
Search the repo for `<PLACEHOLDER>` tokens — each one is listed here.

## Cloudflare (backend)

| Value | Where | How to get |
|---|---|---|
| `<CF_ACCOUNT_ID>` | `wrangler.toml` vars, `.dev.vars` | Dashboard → Workers & Pages → right sidebar |
| `<D1_DATABASE_ID>` | `wrangler.toml` | printed by `wrangler d1 create selfie-db` |
| `<KV_NAMESPACE_ID>` | `wrangler.toml` | printed by `wrangler kv namespace create KV` |
| `<STREAM_CUSTOMER_CODE>` | `wrangler.toml`, mobile `.env.development` | Dashboard → Stream → the `customer-XXXX` subdomain |
| `<CF_STREAM_API_TOKEN>` | secret `STREAM_API_TOKEN` | My Profile → API Tokens → create with **Stream:Edit** |
| `<STREAM_WEBHOOK_SECRET>` | secret | printed when creating the Stream webhook (point it at `https://<worker>/api/webhooks/stream`) |
| `JWT_SECRET` | secret / `.dev.vars` | `openssl rand -base64 48` |

Secrets in prod: `wrangler secret put <NAME>`. Local dev: `apps/backend/.dev.vars`
(copy from `dev.vars.example`).

## World ID (all server-side — the mobile app ships zero World packages)

| Value | Where | How to get |
|---|---|---|
| `<WORLD_APP_ID>` (`app_…`) | backend vars | https://developer.worldcoin.org → create app (create a **staging** app too) |
| `<WORLD_RP_ID>` (`rp_…`) | backend vars | portal → your app → RP configuration |
| `<WORLD_RP_SIGNING_KEY_HEX>` | **secret** (`wrangler secret put WORLD_RP_SIGNING_KEY`) | portal → RP signing key. **Worker-only — never ships to the client** |
| `WORLD_ACTION` (`selfie-gate`) | backend vars | portal → your app → Actions → create |
| `WORLD_ENV` | backend vars | `staging` for dev, `production` for prod (must match the app/rp ids) |
| `APP_SCHEME` (`selfie`) | backend vars | default `return_to` deep-link scheme; the client overrides it with `Linking.createURL` (Expo Go uses `exp://`) |
| `WORLD_VERIFY_MODE` | backend | `live` in prod, `mock` only for local dev |
| Selfie Check beta | — | credential ID 11, Beta — access per-partner (developers@toolsforhumanity.com). `selfieCheckLegacy` preset, 90-day credential |

Mobile needs only `EXPO_PUBLIC_WORLD_MOCK` (dev toggle). `EXPO_PUBLIC_WORLD_APP_ID`
/ `EXPO_PUBLIC_WORLD_ACTION` are no longer used by the client flow.

## CI / GitHub Actions

### Backend (`.github/workflows/deploy-backend.yml`)

Push to `main` auto-deploys the Worker. The workflow substitutes the
`<PLACEHOLDER>` tokens in `apps/backend/wrangler.toml` from repo **Actions secrets**:

| GitHub secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | deploy auth (Workers Scripts:Edit + D1:Edit + KV:Edit) |
| `CF_ACCOUNT_ID` | account id + `<CF_ACCOUNT_ID>` placeholder |
| `D1_DATABASE_ID`, `KV_NAMESPACE_ID` | binding ids |
| `STREAM_CUSTOMER_CODE`, `WORLD_APP_ID`, `WORLD_RP_ID` | vars placeholders |
| `JWT_SECRET`, `STREAM_API_TOKEN`, `STREAM_WEBHOOK_SECRET`, `WORLD_RP_SIGNING_KEY` | optional — synced to Worker secrets after deploy (skipped when unset) |

### Mobile (`.github/workflows/eas-update.yml`)

Push to `main` publishes an EAS Update to **channel `main`** (Expo Go delivery,
no builds). `EXPO_PUBLIC_*` values are baked into the published bundle.

| GitHub secret | Purpose |
|---|---|
| `EXPO_TOKEN` | EAS auth — expo.dev → Account settings → Access tokens |
| `EAS_PROJECT_ID` | updates URL + `extra.eas.projectId` |
| `EXPO_PUBLIC_API_BASE_URL` | **deployed** Worker URL (`https://…workers.dev`) — CI rejects non-https |
| `EXPO_PUBLIC_STREAM_CUSTOMER_CODE` | Stream `customer-XXXX` code |

`EXPO_PUBLIC_WORLD_MOCK` is never set in CI — published bundles always use the
real World ID flow.

## Pexels (seed only)

| Value | Where | How to get |
|---|---|---|
| `<PEXELS_API_KEY>` | `.dev.vars` | https://www.pexels.com/api/ → register → instant key (free, 200 req/h) |

## Mobile / Expo (Expo Go + EAS Update delivery)

| Value | Where | How to get |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `.env.development` | local Worker (`http://<mac-ip>:8787`) or deployed `https://selfie-mvp-backend.<subdomain>.workers.dev`. **Must be the deployed URL before `eas update`** — env is baked into the published bundle |
| `<EAS_PROJECT_ID>` | `.env.development` | `eas init` (use a **neutral** Expo account — its name shows in URLs) |
| Tester link/QR | share manually | `https://qr.expo.dev/eas-update?projectId=<EAS_PROJECT_ID>&runtimeVersion=exposdk:57.0.0&channel=main` (append `&format=url` for a plain link). Testers just need the free Expo Go app |
| Bundle id `com.selfyi.selfie` | `app.config.ts` | already set (D10); only used if you ever leave Expo Go for standalone builds |
| Apple accounts / UDIDs / TestFlight | — | **not needed** in the Expo Go flow |

## Quick reference — what runs where

| Scenario | Mobile env | Backend env |
|---|---|---|
| Local dev, no World App | `EXPO_PUBLIC_WORLD_MOCK=1`, API = LAN ip | `wrangler dev`, `WORLD_VERIFY_MODE=mock` |
| Staging World ID | staging `app_id`, mock off | staging `app_id`, `live` |
| Production | prod `app_id`, mock off, API = workers.dev URL | deployed Worker, `live`, secrets set |
