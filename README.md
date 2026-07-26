<p align="center">
  <img src="logo.svg" width="72" alt="Selfie" />
</p>

<h1 align="center">Selfie</h1>

<p align="center"><b>Meet real people. No photos, no bios — just faces, the moment they show up.</b></p>

<p align="center"><a href="https://sel.fyi">sel.fyi</a></p>

Selfie is a humans-only short-video feed. Live clips from real people — scroll, watch, find someone you'd actually want to know. Every face is checked live, in motion. One person, one account. That's the whole rule.

## Install

You'll also need **World App** for the face check — [world.org/download](https://world.org/download).

### 1. Install Expo Go from TestFlight

**It must be Expo Go for SDK 57.** Older versions will refuse to open the app.
SDK 57 is not on the App Store, so Expo ships it through their public TestFlight
beta.

| Expo Go — TestFlight |
| :--: |
| <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=https%3A%2F%2Ftestflight.apple.com%2Fjoin%2FGZJxxfUU" width="200" alt="Expo Go TestFlight QR" /> |
| [testflight.apple.com/join/GZJxxfUU](https://testflight.apple.com/join/GZJxxfUU) |

Install Apple's TestFlight app first, then open the link, accept the invite and
install Expo Go.

### 2. Sign in to the demo Expo account

Open Expo Go and log in with the shared demo account:

```
email:     selfdemo@proton.me
password:  ethlisbon2026
```

This step is required — Expo Go only opens projects belonging to the signed-in
account. It's a throwaway account made for this demo.

### 3. Open Selfie

Scan this from your phone's camera, or open the link below on the device.

| Selfie |
| :--: |
| <img src="https://qr.expo.dev/eas-update?projectId=7f20ce77-4753-479a-9ad2-832c1ae9cda8&runtimeVersion=exposdk:57.0.0&channel=main" width="200" alt="Open Selfie in Expo Go" /> |
| [Open in Expo Go](https://qr.expo.dev/eas-update?projectId=7f20ce77-4753-479a-9ad2-832c1ae9cda8&runtimeVersion=exposdk:57.0.0&channel=main&format=url) |

First launch asks for a World ID face check. After that you're in.

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

## Run locally

```bash
pnpm install
pnpm --filter @selfie/backend dev    # Cloudflare Worker on :8787
pnpm --filter @selfie/mobile start   # Expo dev server
```

Copy `apps/backend/dev.vars.example` → `.dev.vars` and `apps/mobile/env.development.example` → `.env.development` first.
