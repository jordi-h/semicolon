# semicolon

A TikTok-style feed of bite-sized knowledge. Swipe, scroll, or press ↓
through short trivia cards across eleven broad domains — Science, Technology,
History, Geography, Culture & Society, Space & Universe, Language &
Etymology, Psychology & the Mind, Art & Design, Food & Cuisine, and Sports &
Fitness — save the ones you like, and build a daily streak. The seed dataset
holds 200 curated facts per domain (2,200 total); see "Adding new facts or a
new domain" below for how to keep extending it.

## Stack

- [Vite](https://vite.dev) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components (`src/components/ui`)
- [React Router](https://reactrouter.com) for routing
- [TanStack Query](https://tanstack.com/query) for server state; plain React state/context for UI state
- [Supabase](https://supabase.com) for Postgres + Auth + Row-Level Security
- [Vitest](https://vitest.dev) + React Testing Library for tests
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) — installable on a phone home screen today; see [Mobile / app stores](#mobile--app-stores) for the native app-store path

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

### OAuth sign-in (Google)

The Sign In / Sign Up screen has a "Continue with Google" button
(`src/features/auth/AuthPage.tsx`, `AuthContext.signInWithOAuth`). It
requires enabling Google in the Supabase dashboard **and** creating an
OAuth app in Google Cloud Console — nothing here works until both sides
are done. Full walkthrough below.

Until it's enabled, the button redirects to a Supabase error page instead
of the Google consent screen — that's expected, not a bug in the app.

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
  `tags`, optional `sourceUrl`. Always resolved to the caller's locale
  before it reaches the UI (see "Language" below); the raw `translations`
  field only ever appears on the local seed JSON, never on a `Fact`
  returned from the API.
- **`UserPreferences`** — a user's selected domains and UI/content
  language (editable any time from Settings, not just at onboarding).
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
shape (`hook`, `fact`, optional `whyItMatters`, `domain`, `tags`, optional
`sourceUrl`). No app code changes needed. Each domain currently holds 200
curated facts — there's no hard cap, but keep domains at a roughly even
count so the feed's weighting doesn't end up skewed by one domain simply
having far more content than the others. Re-run `npm run seed` to push the
new facts to Supabase (it's an upsert, so it's safe to re-run any time).

**New domain:**

1. Add the domain's slug to `DOMAINS` in `src/lib/types.ts`, plus a label
   in `DOMAIN_LABELS` (every locale in `LOCALES`, not just English) and an
   emoji in `DOMAIN_EMOJI`.
2. Add a gradient and accent color for it to `DOMAIN_GRADIENTS` and
   `DOMAIN_ACCENT` in `src/lib/domainTheme.ts`.
3. Create `src/data/facts/<domain>.json` (aim for ~200 facts, broad
   umbrella coverage — see the existing files for the convention) and add
   it to the spread in `src/data/facts/index.ts`.
4. Run `npm run seed`.

No other code changes are needed — the domain picker, feed selection,
weighting, resurfacing, and exhaustion-fallback logic all read from
`DOMAINS`/`preferences.domains` generically and don't hardcode which or
how many domains exist.

## Language

The UI and every fact are available in four languages — English, French,
Dutch, Spanish (`LOCALES` in `src/lib/types.ts`). Like facts themselves,
translations are curated static content, authored offline ahead of time —
never a runtime translation call.

- **UI text** lives in `src/lib/i18n/{en,fr,nl,es}.ts`, one flat
  dictionary per locale, all typed against the English dictionary's keys
  (`TranslationKey` in `en.ts`) so a locale missing a key fails to
  typecheck rather than silently falling back at runtime.
  `LocaleContext.tsx` exposes the active `locale`, `setLocale`, and a
  `t(key, vars?)` function (`{{var}}` interpolation) via `useLocale()`.
- **Fact text** — each fact's canonical English `hook`/`fact`/
  `whyItMatters` live on `facts` as before; non-English text lives in
  `fact_translations` (one row per fact per locale), seeded from the
  `translations` field on each entry in `src/data/facts/*.json`. A
  locale missing a translation for a given fact just falls back to the
  English original — see `localizeFact`/`applyServerTranslations` in
  `src/lib/api/facts.ts`.
- **Which locale a user gets:** `LocaleProvider` picks, in order, a
  locale saved on this device (`localStorage`), then the browser's
  language, then English — and once the signed-in user's own
  `preferences.locale` loads, that becomes the source of truth.
  Changing the language picker in Settings updates the UI immediately
  and persists to `user_preferences.locale`.

Adding a fifth language means: add it to `LOCALES` and `LOCALE_NATIVE_NAMES`
in `src/lib/types.ts`, add a `DOMAIN_LABELS` entry, add
`src/lib/i18n/<locale>.ts` (typechecked against `TranslationKey`, so
nothing can be missed), and add a `translations.<locale>` entry to every
fact in `src/data/facts/*.json`.

## How the feed picks the next card

`src/features/feed/lib/pickNextFact.ts` holds the (ML-free) selection
logic. Every card comes from exactly one of three explicit branches,
decided in this order by the `pickNextCard` orchestrator — never an
accidental fallthrough baked into how the random picker happens to be
written:

1. **Fallback** (`pickFallbackCard`) — once every fact in the user's
   selected domains has been seen (`isPoolExhausted`), the feed stops
   excluding seen facts and instead serves the **least-recently-shown**
   fact first, so it rotates through old content instead of repeating
   one fact. No "Remember this?" label here — see below.
2. **Resurface** (`pickResurfaceCandidate`) — otherwise, a small per-card
   chance (`RESURFACE_CHANCE`, ~1 in 35, landing in the "1 in every
   30–40" target) deliberately shows a fact the user saw more than a
   week ago (`RESURFACE_MIN_AGE_MS`), labeled "Remember this?" on the
   card. This is the _only_ branch that gets that label.
3. **Normal** (`pickNormalCard`, the default) — a domain gets a weight
   from `computeDomainWeight` in `src/lib/engagement.ts` (neutral by
   default, pulled up by longer dwell time and "more like this", pulled
   down by fast skips and "less like this"), then the card is a
   weighted-random domain pick followed by a random _unseen_ fact
   within it.

This relies on two separate timestamps per seen fact
(`src/lib/api/seenFacts.ts`, `supabase/schema.sql`): `first_seen_at` is
set once and never overwritten (it gates resurface eligibility),
`last_shown_at` updates on every re-show (it drives the fallback
ordering). A one-time "you've seen everything in your topics" notice
(`ExhaustionNotice.tsx`) shows the first time branch 1 kicks in, tracked
via `user_stats.pool_exhausted_notice_shown` so it never shows twice.

## Sharing a fact

Every card has a share button (`src/features/share/`) that renders a
polished, off-screen 1080×1920 graphic for that single fact — hook, fact
text, a domain accent color, and the semicolon wordmark — using
`html-to-image` (`ShareCardImage.tsx` is the template, `useShareFact.ts`
does the capture + share). On a device that supports the Web Share API
with file attachments, it opens the native share sheet with the image
attached; otherwise it downloads the PNG and copies a shareable link
(`factShareUrl.ts`, `/f/:factId`) to the clipboard.

That `/f/:factId` link (`SharedFactPage.tsx`) is a public route — not
behind `ProtectedRoute` — so it works for people who don't have an
account yet, which is the whole point of a share link. That required
opening up the `facts` table's RLS policy to the `anon` role too (see
`supabase/schema.sql`); nothing else changed, since `facts` content was
already meant to be non-sensitive, publicly-shareable trivia.

**Not built yet:** rich link previews (the image WhatsApp/iMessage/Slack/
Twitter show when you paste the raw `/f/:id` link, before anyone clicks
it) need per-URL Open Graph meta tags served to crawlers that don't run
JavaScript — which means a server or edge-function step, and the specific
approach (e.g. Vercel's `@vercel/og`, a Netlify/Cloudflare edge function,
or a Supabase Edge Function) depends on wherever this ends up hosted.
Worth revisiting once that's decided; the in-app "share image directly"
flow above doesn't need it and works today.

## Content pipeline (future)

All content — including every language's translations, see "Language"
above — is hand-seeded, static, and reviewed ahead of time — there is
no live external API and no per-request LLM call, by design (keeps the app
free to run and avoids fact-checking/hallucination risk at runtime). If an
LLM-assisted authoring pipeline is added later, it should only ever write
new entries (or translations) into `src/data/facts/*.json` **offline**,
the same as a human editor — never call an LLM from the running app.

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
    share/                share-image generation, Web Share API, /f/:id page
  lib/
    api/                data-access layer (Supabase ⇄ local fallback)
    hooks/              shared TanStack Query hooks
    i18n/                UI dictionaries + LocaleContext (see "Language")
    types.ts            shared domain types
    engagement.ts        pure streak/weighting math (unit tested)
    supabaseClient.ts
  routes/               ProtectedRoute
scripts/seed.ts          loads src/data/facts/*.json into Supabase
supabase/schema.sql      tables + row-level security policies
```

## Scripts

| Command                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `npm run dev`            | Start the dev server                               |
| `npm run build`          | Type-check and build for production                |
| `npm run test`           | Run the test suite once                            |
| `npm run test:watch`     | Run tests in watch mode                            |
| `npm run lint`           | Lint with ESLint                                   |
| `npm run format`         | Format with Prettier                               |
| `npm run seed`           | Push `src/data/facts/*.json` into Supabase         |
| `npm run generate-icons` | Rebuild favicons/app icons from `public/logo*.svg` |

## Branding

The mark is a semicolon on a purple gradient — source vectors live in
`public/logo.svg` (rounded, used in-app via `src/components/Logo.tsx`),
`public/logo-square.svg` (edge-to-edge, for platform icons that apply
their own mask, like iOS), and `public/logo-maskable.svg` (glyph scaled
into the safe zone for Android's circular mask). Edit the SVGs, then run
`npm run generate-icons` to regenerate every favicon/app-icon PNG
(`public/favicon-*.png`, `public/apple-touch-icon.png`, `public/icons/*`).

## Mobile / app stores

**Installable today, no store needed:** the app is a PWA (`vite-plugin-pwa`
in `vite.config.ts`) — visiting the deployed site on a phone and choosing
"Add to Home Screen" (iOS Safari) or the install prompt (Android Chrome)
installs it with the semicolon icon, full-screen, no browser chrome.

**Native App Store / Play Store listing:** the app is wrapped with
[Capacitor](https://capacitorjs.com) (appId `com.semicolon.app`,
`capacitor.config.ts`), which packages this same web build into a native
shell without a rewrite. The **Android** project is already generated
(`android/`), icons and splash screens included — see `resources/` for the
source SVGs and `npm run generate-icons` sibling script
`node scripts/generate-icons.mjs` for the web favicons (native app icons
are regenerated separately, see below).

To build and run the Android app:

1. Install [Android Studio](https://developer.android.com/studio) (includes
   the Android SDK).
2. `npm run build && npx cap sync android` — rebuilds the web app and
   copies it into the native project. Run this after any web app change.
3. `npx cap open android` — opens the project in Android Studio, where you
   can run it on an emulator/device (▶) or build a signed release bundle
   (Build → Generate Signed App Bundle) once you have a
   [Google Play Console account](https://play.google.com/console/) ($25
   one-time) to upload it to.

If you change the logo, edit `resources/icon*.svg` / `resources/splash.svg`,
then regenerate everything with:

```bash
npm install -D @capacitor/assets   # dev-only, one-shot tool
npx capacitor-assets generate --android
npm uninstall @capacitor/assets    # remove again — see note below
```

(`@capacitor/assets` pulls in a few CVEs through its own nested
dependencies, all inside a build-time-only tool that's never shipped — the
project only installs it transiently when regenerating icons, then removes
it, same as this repo's history.)

**iOS** needs `npx cap add ios`, which requires **macOS + Xcode** — this
Windows machine can't run that step. Once you have a Mac:

```bash
npm install @capacitor/ios
npx cap add ios
npm run build && npx cap sync ios
npx cap open ios   # opens Xcode
```

From Xcode you'll need an **Apple Developer account** ($99/yr) to sign and
submit through App Store Connect.

**Node version note:** the Capacitor CLI requires Node ≥22 (this project
now assumes Node 24 LTS) — if `npx cap` commands fail with a Node version
error, check `node -v`.
