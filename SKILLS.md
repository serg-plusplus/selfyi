# Agent Skills for this repo

Skills an AI coding agent should have installed when working on `selfie`.
All entries are popular/official sources (nothing is vendored into
`~/.agents/skills`; install per-project or per-user as you prefer).

## House rule: no comments in code

**Do not write comments.** Code must explain itself through descriptive
names, small functions and explicit types. Anything that genuinely needs
prose belongs in `SPEC.md`. The only allowed exceptions are functional
directives (`@ts-expect-error`, `eslint-disable`, `/// <reference>`).
This applies to new code and to any file you touch.

## Must-have (match the stack 1:1)

| Skill | Source | Install | Why |
|---|---|---|---|
| **Cloudflare Wrangler** | [cloudflare/skills](https://github.com/cloudflare/skills) (official) | `npx skills add https://github.com/cloudflare/skills --skill wrangler` | Workers deploys, `wrangler dev`, D1/KV/Queues bindings — the whole backend workflow |
| **Cloudflare Platform** | [cloudflare/skills](https://github.com/cloudflare/skills) | `npx skills add https://github.com/cloudflare/skills --skill cloudflare` | D1 SQL, KV patterns, Stream API usage |
| **Expo** | [expo/skills](https://github.com/expo/skills) (official) | `claude plugin install expo@claude-plugins-official` (or `npx skills add https://github.com/expo/skills`) | expo-router, prebuild/dev-clients, EAS build & ad-hoc distribution |
| **World ID** | [docs.world.org/world-id/SKILL](https://docs.world.org/world-id/SKILL) (official docs skill) | download SKILL.md into `.agents/skills/world-id/` | IDKit sessions, proof verification, nullifiers, Selfie Check specifics |

## Useful (general development on this repo)

| Skill | Source | Why |
|---|---|---|
| **anthropics/skills** collection | [github.com/anthropics/skills](https://github.com/anthropics/skills) — `/plugin marketplace add anthropics/skills` | official general-purpose skills (docs, artifacts) |
| **grilling** | user skill (`~/.agents/skills/grilling`) | the decision-interview style used to produce SPEC.md — reuse for the next feature round |
| **research** | user skill (`~/.agents/skills/research`) | primary-source doc research (World ID / Cloudflare APIs change often) |
| **find-skills** | user skill (`~/.agents/skills/find-skills`) | discover new skills as the stack grows |

## Notes

- Browse [skills.sh](https://www.skills.sh) for community skills; prefer the
  official `cloudflare/`, `expo/`, `anthropics/` namespaces above.
- When Selfie Check exits beta, refresh the World ID skill from the docs.
  The verify endpoint is v4 (`POST /api/v4/verify/{rp_id}`).
