# Working in this repo

Architecture, data model, and commands live in `README.md` — read that
rather than duplicating it here. This file is only for things that
change *how* to work, not *what* the code does.

## Fan-out work (bulk content generation, mass edits, migrations)

This repo has 2,200 curated facts × 4 locales, so "translate everything"
and "generate N facts per domain" style tasks come up. They are run by
fanning work out to subagents. Follow this protocol — it was learned the
expensive way (see "Why", below).

**1. Size batches to finish, not to be efficient.**
Target **≤40 items (~50k subagent tokens) per agent**. Not 80. Not 100.
A batch that dies before writing produces *nothing* — all its tokens are
lost, so an oversized batch is not a faster batch, it is a riskier one.

**2. Make every run resumable before starting it.**
- Stage inputs as `in-<name>.json`, outputs as `out-<name>.json`.
- Key every record by a **stable id** (`science-042`), never array position.
- The merge step reads all existing output, matches by id, and **skips
  anything already complete**.
- Consequence: an interruption costs one batch, never the run, and
  re-running the whole pipeline is safe and cheap.

**3. Bank progress continuously.**
After each wave: merge → typecheck → test → commit. Never let a long
run accumulate hours of unsaved work. Every commit should leave the app
shippable.

**4. Tell subagents to write first, validate second.**
Instruct them explicitly: *"write the output file first and fast; do not
draft everything before writing."* Agents that compose the whole result
in-context and write at the very end are the ones that lose it all.

**5. Cap concurrency at ~4.**
More agents in flight means more simultaneous work destroyed when a
shared session limit trips.

**6. Price the job out loud before starting it.**
Before generating/translating more than a few hundred items, state the
estimated token cost and confirm scope. Offer a smaller scope as a real
option — "the six original domains only" is a legitimate answer and may
be what's wanted.

**7. Verify subagent claims against the artifact.**
A subagent reporting "done, 100/100" is not evidence. Check the file:
count records, confirm required fields, confirm ids match the input.

### Why

A translation pass was first run as 84–100-fact batches at 11 agents
concurrent. Agents translated their full batch (~90–140k tokens each),
then hit the session limit *at the final write step* and lost everything.
That happened twice — roughly 1.6M tokens spent for two usable files.
Re-cut to 40-fact chunks at ~4 concurrent with id-keyed resumable merge:
every subsequent chunk landed, ~52k tokens each.

## Content and data

- `src/data/facts/*.json` is the single source of truth for content.
  `scripts/seed.ts` pushes it to Supabase; the app reads from Supabase in
  production and falls back to this dataset only when Supabase is
  unconfigured (local dev).
- That fallback dataset is **lazily imported** and excluded from the PWA
  precache on purpose (`vite.config.ts`) — it is ~2 MB and production
  clients must never download it. If a change makes the main bundle
  balloon, check that this split is still intact before raising any
  size limit.
- After editing facts, run `npm run seed` — repo changes alone do not
  reach production.

## Before committing

`npx tsc -b && npx vitest run && npx eslint .` — all three. The test
suite includes i18n guards (`dictionaries.test.ts` for locale key parity
and tight-space string budgets, `no-hardcoded-strings.test.ts` for text
bypassing `t()`); if either fails, fix the cause rather than the test.
