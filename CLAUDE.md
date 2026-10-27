# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` holds the full project rules (product overview, tech stack, UI quality bar, quiz flow). Read it before building a feature. The essentials are summarized below.

## Commands

- `npm start` — Expo dev server (`npm run ios` / `android` / `web` to target a platform)
- `npm run lint` — `expo lint` (ESLint with `eslint-config-expo`)
- Type-check: `npx tsc --noEmit` (strict mode is on)
- There is no test runner configured yet.

## Current state

The `(tabs)` group exists (`index`, `pinned`, `settings`) under a root `Stack` with headers hidden. Zustand + AsyncStorage stores live in `store/`. The `(auth)` group and Clerk are not set up yet.

Events are real, scraped on demand by the Expo Router API route `app/api/events+api.ts` (`GET /api/events?location=&distance=&days=&times=&interests=`, the raw preference strings). It calls `lib/scrapers/` (one adapter per source), normalizes to `EventItem` (`lib/scrapers/normalize.ts`, categories from `lib/categorize.ts`), then filters and ranks by distance/availability/interests (`lib/ranking.ts`). Sources: Luma (its internal discover API, by coordinates), Meetup (GraphQL `api.meetup.com/gql-ext`, no token needed for search), Eventbrite (NYC search pages' `window.__SERVER_DATA__`, plus optional official-API price lookups), NYC Parks (live JSON feed; the Open Data dataset is stale), and key-gated Ticketmaster, SeatGeek and PredictHQ. Keys go in `.env.local` (see `.env.example`). A source without its key is skipped. Eventbrite and NYC Parks only run near NYC. Results are cached for 30 min per source on `globalThis` (the dev server re-runs API modules per request). The app fetches it with `hooks/useEvents.ts`. Pinned events are stored as whole objects in `store/events.ts`. The Supabase/Python backend described in `AGENTS.md` is still a later step.

## Architecture notes

- **Routing**: Expo Router (file-based) in `app/`. Screens only compose components, hooks and stores. Reusable UI goes in `components/`, hardcoded data in `data/` (e.g. `data/settings.ts` drives the settings screen), images through `constants/images.ts`.
- **Path alias**: `@/*` maps to the repo root (e.g. `@/global.css`, `@/components/...`).
- **Styling is NativeWind v5 (`5.0.0-rc.0`) on Tailwind 4 and `react-native-css`**, not v4. Don't use v2/v4 patterns (no `tailwind.config.js`, no `babel` preset). Theme and utilities live in `global.css`, imported once in `app/_layout.tsx`. Per `AGENTS.md`, use Tailwind classes only (no `StyleSheet`), and put reusable class groups in `global.css` as BEM-named classes with `@apply` (e.g. `.empty-state__title`). Don't upgrade NativeWind without approval.
- **Metro config** (`metro.config.js`) wraps the default config with `withNativewind`. NativeWind v5 replaces `react-native` with its own wrapper that lacks `AssetRegistry`, so a custom `resolveRequest` hands the real `react-native` to `expo-asset` and `expo-image`. Keep that workaround if you touch the resolver.
- **Settings screen** is dark (`.settings-screen`), while the other tab screens use the light violet theme (`.tab-screen`).
