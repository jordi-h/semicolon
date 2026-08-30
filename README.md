# semico

A TikTok-style feed of bite-sized knowledge. Swipe, scroll, or press ↓
through short trivia cards across twelve broad domains — Science, Technology,
History, Geography, Culture & Society, Space & Universe, Language &
Etymology, Psychology & the Mind, Art & Design, Food & Cuisine, Sports &
Fitness, and Law & Politics — save the ones you like, and build a daily
streak. The seed dataset holds 200 curated facts per domain (2,400 total),
each translated into French, Dutch and Spanish; see "Adding new facts or a
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
- **`TagAffinity`** — the same signal at tag granularity, for the
  finer-grained second weight described under "How the feed picks the
  next card". Both share the `EngagementSignal` scoring shape.
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
2. Add an accent color to `DOMAIN_ACCENT` in `src/lib/domainTheme.ts`.
   The card gradient is derived from it by `domainGradient()`, so there's
   nothing else to pick. Read the comment above the map first: the hues
   are a matched set on one formula, and the ring is getting crowded.
3. Create `src/data/facts/<domain>.json` and add it to the spread in
   `src/data/facts/index.ts`. An empty `[]` compiles, so you can wire the
   domain up and typecheck before any content exists.
4. Write ~200 facts, then translate them into every locale — a domain
   with English-only facts will show English cards to French, Dutch and
   Spanish users, since `localizeFact` falls back to the original.
5. Run `npm run seed`.

Steps 1–3 are typed, so `tsc -b` tells you what's missing — every
per-domain map is `Record<Domain, …>`. No other code changes are needed:
the domain picker, feed selection, weighting, resurfacing, and
exhaustion-fallback logic all read from `DOMAINS`/`preferences.domains`
generically and don't hardcode which or how many domains exist.

**Generating content at volume** is a fan-out job — see `CLAUDE.md` for
the batching protocol. Three things that cost real time when the `law`
domain was added:

- **Independent writers converge.** Assigning each agent a topic slice is
  not enough; they still produced three separate Althing facts and two
  Miranda cards. Budget a surplus (267 candidates for 200 slots) so
  duplicates can be dropped rather than kept for want of alternatives.
- **Dedupe against the existing corpus too**, not just within the batch.
  A Jaccard-style similarity check catches most of it, but the threshold
  is a blunt instrument — the Twelve Tables duplicated an existing
  `history` fact at 0.29, under the 0.33 cutoff, and was only caught by
  reading the near-misses. Compare replacement candidates against the
  records you just *dropped* as well as the ones you kept.
- **Audit before translating.** A correction found in English costs one
  edit; the same correction after translation costs the edit plus three
  re-translations.

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
   weighted-random domain pick followed by a weighted-random _unseen_
   fact within it.

That second weight is **tag** affinity, and it applies to branch 3 only —
the fallback and resurface branches have their own ordering rules that
tag weighting would undermine. Every fact already carried `tags[]`
(`science`, `history`, …) that nothing read; `src/lib/api/tagAffinity.ts`
now records the same dwell/reaction signal per tag that domains already
got, and `factTagWeight` in `pickNextFact.ts` averages a fact's tag
weights into its pick probability. It reuses `computeDomainWeight` — the
scoring shape is identical, so `EngagementSignal` was widened rather than
duplicated. The effect is a finer grain than domains alone: someone who
likes space facts but skips the chemistry ones inside Science gets more
of what they actually stayed on. A fact with no tags weighs 1 (neutral),
so untagged content is never penalised.

This relies on two separate timestamps per seen fact
(`src/lib/api/seenFacts.ts`, `supabase/schema.sql`): `first_seen_at` is
set once and never overwritten (it gates resurface eligibility),
`last_shown_at` updates on every re-show (it drives the fallback
ordering). A one-time "you've seen everything in your topics" notice
(`ExhaustionNotice.tsx`) shows the first time branch 1 kicks in, tracked
via `user_stats.pool_exhausted_notice_shown` so it never shows twice.

## Reading offline

The app is already installable (`vite-plugin-pwa` precaches the shell),
but a precached shell with no data is just a spinner. `fetchFactsByDomains`
in `src/lib/api/facts.ts` is cache-aside: on a successful fetch it writes
a bounded buffer to IndexedDB, and when the network fails it reads that
buffer back instead of erroring.

- **`src/lib/offlineCache.ts`** is a ~70-line hand-rolled promise wrapper
  over IndexedDB — no dependency, because the whole surface is get and
  set. Every path degrades to "no cache" rather than throwing: private
  browsing, blocked storage, and quota errors must not break the feed.
- **The buffer is 200 facts, shuffled, not the first 200.** The feed
  picks randomly, so a positional slice would make every offline session
  serve the same corner of the pool. 200 is enough for a long commute
  without writing megabytes to every device on every fetch.
- **The key is `facts:<sorted domains>:<locale>`.** Sorting matters —
  otherwise the same domain set in a different order would miss its own
  cache. Locale is in the key because translated text is baked into the
  cached rows.
- **An empty cache re-throws.** Returning `[]` would render the feed's
  "no facts in your topics" empty state, which is a lie; re-throwing lets
  the real error state show.

`fetchFactsByIds` (used by saved facts and `/f/:id`) is deliberately
*not* cached — it's a lookup by explicit id, not a browsing buffer.

## Sharing a fact

Every card has a share button (`src/features/share/`) that renders a
polished, off-screen 1080×1920 graphic for that single fact — hook, fact
text, a domain accent color, and the semico wordmark — using
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

### Link previews

Pasting a raw `/f/:id` link into WhatsApp/iMessage/Slack/Discord/X used to
show a bare URL: those crawlers don't run JavaScript, and this is a
client-rendered SPA whose static `index.html` carries only generic meta
tags. `api/fact-page.ts` fixes that. `vercel.json` rewrites `/f/:factId`
to it; it fetches the real built `index.html` (so the hashed asset
references stay correct), looks the fact up through Supabase's REST API
with the public anon key, and injects per-fact `og:` / `twitter:` tags
plus a fact-specific `<title>`. `?lang=` is honoured, falling back to the
English original when a translation is missing — the same rule the app
applies. Unknown ids degrade to the generic shell rather than erroring.
Human visitors get the untouched SPA; the extra tags are inert for them.

Two things are worth knowing before touching it:

- **It runs on the Node runtime, not edge.** Vercel's edge bundler
  rejected the function with "referencing unsupported modules: @vercel"
  even when it imported nothing at all. Node has no such allowlist, and
  the latency difference on an edge-cached call is immaterial.
- **The handler takes `(req, res)`, not a `Request`.** Vercel's Node
  runtime hands over an `IncomingMessage`/`ServerResponse` pair; assuming
  the Web signature fails with `request.headers.get is not a function`.

Because `api/` lives outside `src/`, Vercel type-checks it with the
**root** `tsconfig.json` — which is why that file carries
`compilerOptions` of its own — and `tsconfig.edge.json` (referenced from
the root solution, so `npm run build`'s `tsc -b` picks it up) covers it
locally, so deployed code outside `src/` isn't left unchecked.

**Follow-up worth doing:** `og:image` currently points at a static
branded card (`resources/og-default.svg` → `public/og-default.png`, built
by `npm run generate:icons`), so every fact previews with the same
picture. A per-fact generated image was attempted with `@vercel/og` and
abandoned — it built only after several workarounds, then failed at
runtime with "Failed to load the ES module". Doing it properly means
rendering the image outside the request path (e.g. generating a PNG per
fact at seed time and uploading it to Supabase Storage, then pointing
`og:image` at that URL), which also removes the per-request cost. The
fact's own words already reach previews via `og:title`/`og:description`,
which is the bulk of the value.

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
| `npm run generate:icons` | Rebuild every favicon/app/splash icon from the source mark |

## Branding

The mark — a semico (dot over a rounded bar) on a dark rounded-square
tile — has one source of truth: **`src/assets/logo-icon.svg`**
(`src/assets/logo-icon-light.svg` is the color-inverted variant, for any
context that needs a light tile). `src/components/Logo.tsx` renders this
mark in-app as a `variant` (`icon` | `full`, i.e. icon-only vs.
icon+wordmark) × `theme` (`dark` | `light`) component — reach for it
instead of duplicating the SVG or an icon-plus-text row per call site.

Everything else — favicons, the PWA manifest icons, and the native
iOS/Android app icons + splash screens — is *generated* from that one
file, never hand-edited:

- `scripts/generate-icons.mjs` rasterizes `logo-icon.svg` into
  `public/favicon.ico`, `public/favicon-{16,32}.png`,
  `public/apple-touch-icon.png`, `public/icons/pwa-{192,512}.png`, and
  maskable variants (`public/icons/pwa-maskable-*.png`, safe-zone-padded
  by compositing `resources/icon-foreground.svg` over a flat background).
- `resources/icon-only.svg` / `icon-foreground.svg` / `icon-background.svg`
  / `splash.svg` are hand-scaled 1024×1024 (2732×2732 for splash) copies
  of the same mark, split into layers where a platform needs them
  (Android's adaptive icon foreground/background). `@capacitor/assets`
  (a regular devDependency — no more install/uninstall dance) reads these
  to write the actual iOS `Assets.xcassets` and Android `mipmap-*`/
  `drawable-*` resources.

If the mark ever changes: edit `src/assets/logo-icon{,-light}.svg`, apply
the same edit proportionally to the four `resources/*.svg` files (they're
plain scaled-up copies, not derived automatically — see the coordinates
already there for the scale factor), then run:

```bash
npm run generate:icons
```

which runs both generators in sequence and rewrites every favicon, app
icon, and splash screen at once.

## Mobile / app stores

**Installable today, no store needed:** the app is a PWA (`vite-plugin-pwa`
in `vite.config.ts`) — visiting the deployed site on a phone and choosing
"Add to Home Screen" (iOS Safari) or the install prompt (Android Chrome)
installs it with the semico icon, full-screen, no browser chrome.

**Native App Store / Play Store listing:** the app is wrapped with
[Capacitor](https://capacitorjs.com) (appId `com.semico.app`,
`capacitor.config.ts`), which packages this same web build into a native
shell without a rewrite. Both the **Android** (`android/`) and **iOS**
(`ios/`) projects are already generated, icons and splash screens
included — see "Branding" above for how those get (re)generated.

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

Regenerating icons/splash screens for both platforms is just
`npm run generate:icons` (see "Branding" above). `@capacitor/assets`
pulls in a few CVEs through its own nested dependencies, all inside a
build-time-only tool that's never shipped — acceptable for a devDependency,
but worth knowing if `npm audit` flags it.

Adding the `ios/` platform itself (`npx cap add ios`) works fine from
Windows — no Xcode needed just to scaffold the project or regenerate its
icons. **Building/running/signing it does** need a Mac:

```bash
npm run build && npx cap sync ios
npx cap open ios   # opens Xcode — macOS only from here
```

From Xcode you'll need an **Apple Developer account** ($99/yr) to sign and
submit through App Store Connect.

**Node version note:** the Capacitor CLI requires Node ≥22 (this project
now assumes Node 24 LTS) — if `npx cap` commands fail with a Node version
error, check `node -v`.
