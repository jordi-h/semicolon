# InfiniScroll

A TikTok-style feed of bite-sized knowledge. Swipe, scroll, or press ↓
through short trivia cards across six broad domains — Science, Technology,
History, Geography, Culture & Society, and Space & Universe — save the ones
you like, and build a daily streak.

## Stack

- [Vite](https://vite.dev) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components (`src/components/ui`)
- [React Router](https://reactrouter.com) for routing
- [TanStack Query](https://tanstack.com/query) for server state; plain React state/context for UI state
- [Supabase](https://supabase.com) for Postgres + Auth + Row-Level Security
- [Vitest](https://vitest.dev) + React Testing Library for tests

## Getting started

```bash
npm install
npm run dev
```

That's it — the app runs immediately with **no Supabase project required**.
When `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` aren't set, every piece
of the data layer (`src/lib/api/*.ts`) automatically falls back to the
local seed dataset in `src/data/facts/` plus `localStorage`, under a
per-browser "guest" identity. This is how you get the real feed feel
without any setup — see [Local dev mode](#local-dev-mode) below.

### Connecting a real Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (all three are
   on your project's **Settings → API** page).
3. Run `supabase/schema.sql` against your project — paste it into the SQL
   Editor in the Supabase dashboard, or `supabase db push` if you use the
   Supabase CLI. This creates the tables and row-level security policies.
4. Seed the content:
   ```bash
   npm run seed
   ```
5. `npm run dev` again — the app now talks to Supabase, and real email/password
   or magic-link auth is required to use it.

## Local dev mode

`src/lib/supabaseClient.ts` exports `isSupabaseConfigured`. Every function
in `src/lib/api/` checks it and branches between a Supabase call and a
`localStorage`-backed equivalent — same inputs and outputs either way, so
nothing else in the app needs to know or care which mode it's running in.
`AuthContext` does the same: with no Supabase project configured, every
visitor is automatically a "guest" user (a random id persisted in
`localStorage`) and the login screen is skipped entirely.

This means you can build and test the whole feed/save/streak experience
without ever touching Supabase, and the same code path becomes the real,
per-user, RLS-protected implementation the moment you add credentials.

## Data model

Defined in `src/lib/types.ts`:

- **`Fact`** — one card: `hook`, `fact`, optional `whyItMatters`, `domain`,
  `tags`, optional `sourceUrl`.
- **`UserPreferences`** — a user's selected domains (editable any time from
  Settings, not just at onboarding).
- **`SavedFact`** — a user's hearted facts.
- **`DomainAffinity`** — per-user, per-domain rolling engagement signal
  (average dwell time + reaction score) used to weight the feed.
- **`UserStats`** — streak counters and total facts learned.

Supabase tables mirror these 1:1 — see `supabase/schema.sql` for the exact
columns and RLS policies (every table restricts rows to `auth.uid()`,
except `facts`, which is public-read and written only by the seed script
via the service-role key).

## Adding new facts or a new domain

**New facts:** open the relevant file in `src/data/facts/` (one JSON file
per domain) and add an entry with a unique `id`, following the existing
shape. No app code changes needed. Re-run `npm run seed` to push the new
facts to Supabase (it's an upsert, so it's safe to re-run any time).

**New domain:**

1. Add the domain's slug to `DOMAINS` in `src/lib/types.ts`, plus a label
   in `DOMAIN_LABELS` and an emoji in `DOMAIN_EMOJI`.
2. Add a gradient for it to `DOMAIN_GRADIENTS` in
   `src/features/feed/components/FactCard.tsx`.
3. Create `src/data/facts/<domain>.json` and add it to the spread in
   `src/data/facts/index.ts`.
4. Run `npm run seed`.

## How the feed picks the next card

`src/features/feed/lib/pickNextFact.ts` holds the (ML-free) selection
logic: each domain gets a weight from `computeDomainWeight` in
`src/lib/engagement.ts` (neutral by default, pulled up by longer dwell
time and "more like this", pulled down by fast skips and "less like
this"), then the next card is a weighted-random domain pick followed by a
random unseen fact within it. A domain's seen set only resets once every
fact in it has been shown — so a card never repeats until its domain's
pool is exhausted.

## Content pipeline (future)

All content is hand-seeded, static, and reviewed ahead of time — there is
no live external API and no per-request LLM call, by design (keeps the app
free to run and avoids fact-checking/hallucination risk at runtime). If an
LLM-assisted authoring pipeline is added later, it should only ever write
new entries into `src/data/facts/*.json` **offline**, the same as a human
editor — never call an LLM from the running app.

## Project structure

```
src/
  components/ui/       shadcn/ui primitives
  data/facts/           curated seed content (JSON, one file per domain)
  features/
    auth/                sign in/up, AuthContext
    feed/                 the swipeable feed, weighting logic
    onboarding/          domain picker
    saved/                saved facts list
    settings/            profile, stats, edit preferences
  lib/
    api/                data-access layer (Supabase ⇄ local fallback)
    hooks/              shared TanStack Query hooks
    types.ts            shared domain types
    engagement.ts        pure streak/weighting math (unit tested)
    supabaseClient.ts
  routes/               ProtectedRoute
scripts/seed.ts          loads src/data/facts/*.json into Supabase
supabase/schema.sql      tables + row-level security policies
```

## Scripts

| Command                | Description                                   |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start the dev server                           |
| `npm run build`         | Type-check and build for production            |
| `npm run test`          | Run the test suite once                        |
| `npm run test:watch`    | Run tests in watch mode                        |
| `npm run lint`          | Lint with ESLint                               |
| `npm run format`        | Format with Prettier                           |
| `npm run seed`          | Push `src/data/facts/*.json` into Supabase      |
