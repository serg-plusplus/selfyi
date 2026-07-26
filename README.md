<p align="center">
  <img src="logo.svg" width="72" alt="Selfie" />
</p>

<h1 align="center">Selfie</h1>

<p align="center"><b>Meet real people. No photos, no bios — just faces, the moment they show up.</b></p>

<p align="center"><a href="https://sel.fyi">sel.fyi</a></p>

Selfie is a humans-only short-video feed. Live clips from real people — scroll, watch, find someone you'd actually want to know. Every face is checked live, in motion. One person, one account. That's the whole rule.

## What's inside

- TikTok-style vertical feed of short front-camera clips
- Record → upload → in the feed, straight from the phone
- Profiles are just a @handle and your videos — no bios, no filters, no fakes
- Signing up **is** a selfie: no name, no email, no phone number

## Every face is real — World ID

Access is gated by [World ID](https://world.org) Selfie Check:

1. On first launch the app hands off to **World App**, where the user completes a **Selfie Check** — a live, in-motion face check.
2. A **Cloudflare Durable Object** holds the World ID bridge session and verifies the **zero-knowledge proof** entirely server-side. Keys, proofs and World ID secrets never touch the client — the mobile app ships zero World ID code.
3. The proof's **nullifier** becomes the account anchor: one human = one account. Nothing else is collected or stored.

## Stack

| Layer    | Tech                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| Mobile   | Expo (React Native), expo-router, expo-video, tRPC + TanStack Query               |
| API      | Cloudflare Workers — Hono + tRPC                                                  |
| Data     | Cloudflare D1, KV, Durable Objects                                                |
| Video    | Cloudflare Stream (direct upload, HLS, webhooks)                                  |
| Identity | World ID 4.0 — IDKit, Selfie Check credential, server-side proof verification     |

TypeScript end-to-end (shared types from the Worker to the app), pnpm + turbo monorepo, deployed by GitHub Actions on every push.

## Try it

1. Install **Expo Go** — [App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Install **World App** — [world.org/download](https://world.org/download) (needed for the selfie check)
3. Open Selfie in Expo Go — scan the QR:

<p align="center">
  <img src="https://qr.expo.dev/eas-update?projectId=7f20ce77-4753-479a-9ad2-832c1ae9cda8&runtimeVersion=exposdk:57.0.0&channel=main" width="220" alt="Open in Expo Go" />
</p>

or open this link on your phone:

```
https://qr.expo.dev/eas-update?projectId=7f20ce77-4753-479a-9ad2-832c1ae9cda8&runtimeVersion=exposdk:57.0.0&channel=main&format=url
```

## Run locally

```bash
pnpm install
pnpm --filter @selfie/backend dev    # Cloudflare Worker on :8787
pnpm --filter @selfie/mobile start   # Expo dev server
```

Copy `apps/backend/dev.vars.example` → `.dev.vars` and `apps/mobile/env.development.example` → `.env.development` first.
