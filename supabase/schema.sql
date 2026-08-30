-- semico database schema.
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`
-- if you use the Supabase CLI) before running `npm run seed`.

-- ─────────────────────────────────────────────────────────────────────────
-- facts: the curated content pool. Publicly readable -- including by
-- anonymous (logged-out) visitors, since shared fact links
-- (src/features/share/SharedFactPage.tsx) need to work for people who
-- don't have an account yet. Written only by the seed script (which uses
-- the service_role key and therefore bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.facts (
  id text primary key,
  domain text not null,
  hook text not null,
  fact text not null,
  why_it_matters text,
  tags text[] not null default '{}',
  source_url text,
  created_at timestamptz not null default now()
);

alter table public.facts enable row level security;

create policy "facts are publicly readable"
  on public.facts for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- fact_translations: curated non-English text for a fact, one row per
-- (fact, locale). English itself lives on `facts` directly rather than
-- here, so a locale with no translation yet just falls back to that.
-- Same access pattern as `facts` -- publicly readable, written only by
-- the seed script via the service_role key.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.fact_translations (
  fact_id text not null references public.facts (id) on delete cascade,
  locale text not null,
  hook text not null,
  fact text not null,
  why_it_matters text,
  primary key (fact_id, locale)
);

alter table public.fact_translations enable row level security;

create policy "fact translations are publicly readable"
  on public.fact_translations for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- user_preferences: which domains and language a user wants in their
-- feed. One row per user, editable any time from settings.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  domains text[] not null default '{}',
  locale text not null default 'en',
  updated_at timestamptz not null default now()
);

-- Safe to re-run against a project provisioned before the language
-- feature shipped, where `create table if not exists` above is a no-op
-- and this table is missing the column.
alter table public.user_preferences add column if not exists locale text not null default 'en';

alter table public.user_preferences enable row level security;

create policy "users manage their own preferences"
  on public.user_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- saved_facts: the user's "hearted" facts, shown on the Saved page.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.saved_facts (
  user_id uuid not null references auth.users (id) on delete cascade,
  fact_id text not null references public.facts (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, fact_id)
);

alter table public.saved_facts enable row level security;

create policy "users manage their own saved facts"
  on public.saved_facts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- seen_facts: which facts a user has already been shown, so the feed never
-- repeats a card. Two separate timestamps, both maintained by
-- src/features/feed/lib/pickNextFact.ts's three explicit branches:
--   - first_seen_at is set once and never overwritten -- it gates whether a
--     fact is old enough (>1 week) to be a "Remember this?" resurfacing
--     candidate.
--   - last_shown_at updates on every re-show (resurfaced or fallback) --
--     it's what "least-recently-shown first" sorts by once a user has
--     exhausted every fact in their selected domains, so that fallback
--     rotates through old content instead of getting stuck on one fact.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.seen_facts (
  user_id uuid not null references auth.users (id) on delete cascade,
  fact_id text not null references public.facts (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_shown_at timestamptz not null default now(),
  primary key (user_id, fact_id)
);

alter table public.seen_facts enable row level security;

create policy "users manage their own seen facts"
  on public.seen_facts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- domain_affinity: rolling engagement signal per user per domain, used to
-- weight which domain the next card is drawn from (see §4.3 of the spec).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.domain_affinity (
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null,
  avg_dwell_ms numeric not null default 0,
  reaction_score integer not null default 0,
  cards_seen integer not null default 0,
  primary key (user_id, domain)
);

alter table public.domain_affinity enable row level security;

create policy "users manage their own domain affinity"
  on public.domain_affinity for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- tag_affinity: the finer-grained sibling of domain_affinity. Domains are
-- broad (11 buckets), so a "less like this" on a chemistry card would
-- otherwise damp all of Science. Every fact already carries 1-3 curated
-- tags, so the same signal is tracked per tag and used to bias which fact
-- is chosen *within* the already-picked domain (see pickNormalCard).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.tag_affinity (
  user_id uuid not null references auth.users (id) on delete cascade,
  tag text not null,
  avg_dwell_ms numeric not null default 0,
  reaction_score integer not null default 0,
  cards_seen integer not null default 0,
  primary key (user_id, tag)
);

alter table public.tag_affinity enable row level security;

create policy "users manage their own tag affinity"
  on public.tag_affinity for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- user_stats: streaks and total facts learned, shown in the profile.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  facts_learned integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  -- One-time "you've seen everything in your topics" notice, shown the
  -- first time the exhausted-pool fallback kicks in and never again.
  pool_exhausted_notice_shown boolean not null default false
);

alter table public.user_stats enable row level security;

create policy "users manage their own stats"
  on public.user_stats for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
