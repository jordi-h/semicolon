import type { CardSource, Domain, Fact, SeenFact } from '@/lib/types'

/** Picks one item from a weighted pool. All weights must be > 0. */
export function weightedRandomPick<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight)
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = Math.random() * total

  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return items[i]
  }
  return items[items.length - 1]
}

/** Roughly 1 in every 30–40 cards should deliberately resurface an old
 * fact — implemented as a fixed per-card probability whose expected
 * interval falls in that range. */
export const RESURFACE_CHANCE = 1 / 35

/** A resurfaced fact must have first been seen at least this long ago. */
export const RESURFACE_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface QueuedCard {
  fact: Fact
  source: CardSource
}

/** True once every fact in the given (already domain-scoped) pool has a
 * seen_facts row — the trigger for switching from random selection to
 * the least-recently-shown fallback. Self-corrects the moment the pool
 * grows (new domain added, new content seeded), since it's recomputed
 * fresh from current state rather than latched. */
export function isPoolExhausted(pool: Fact[], seenIds: ReadonlySet<string>): boolean {
  return pool.length > 0 && pool.every((fact) => seenIds.has(fact.id))
}

/**
 * Branch 1 — normal (default) selection: weighted-random domain, then a
 * random fact from it that isn't in `excludeIds`. Returns null once
 * every selected domain has nothing left to offer, which is the signal
 * to fall back to the exhausted-pool branch.
 */
export function pickNormalCard(
  pool: Fact[],
  domains: Domain[],
  weights: Partial<Record<Domain, number>>,
  excludeIds: ReadonlySet<string>,
): Fact | null {
  const byDomain = new Map<Domain, Fact[]>()
  for (const domain of domains) {
    byDomain.set(
      domain,
      pool.filter((f) => f.domain === domain && !excludeIds.has(f.id)),
    )
  }

  const available = domains.filter((d) => (byDomain.get(d)?.length ?? 0) > 0)
  if (available.length === 0) return null

  const domain = weightedRandomPick(available, (d) => weights[d] ?? 1)
  const candidates = byDomain.get(domain)!
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Branch 2 — deliberate resurfacing exception: a uniformly random fact
 * the user first saw more than a week ago, for the "Remember this?"
 * callback. Returns null when there's no eligible fact yet (e.g. the
 * user's account is under a week old, or every seen fact is too recent).
 */
export function pickResurfaceCandidate(
  pool: Fact[],
  seenByFactId: ReadonlyMap<string, SeenFact>,
  excludeIds: ReadonlySet<string>,
  now: number = Date.now(),
): Fact | null {
  const eligible = pool.filter((fact) => {
    if (excludeIds.has(fact.id)) return false
    const seen = seenByFactId.get(fact.id)
    if (!seen) return false
    return now - new Date(seen.firstSeenAt).getTime() >= RESURFACE_MIN_AGE_MS
  })
  if (eligible.length === 0) return null
  return eligible[Math.floor(Math.random() * eligible.length)]
}

/**
 * Branch 3 — exhausted-pool fallback: once every fact in the selected
 * domains has been seen, keep the feed going by serving the
 * least-recently-shown fact first — deliberately not random, and never
 * labeled as a resurface (that label is reserved for branch 2). Relies
 * on last_shown_at, which this branch itself keeps advancing each time
 * it re-shows a fact, so it rotates through old content instead of
 * getting stuck repeating a single fact forever.
 */
export function pickFallbackCard(
  pool: Fact[],
  seenByFactId: ReadonlyMap<string, SeenFact>,
  excludeIds: ReadonlySet<string>,
): Fact | null {
  const candidates = pool.filter((fact) => !excludeIds.has(fact.id))
  if (candidates.length === 0) return null

  const lastShown = (fact: Fact) => seenByFactId.get(fact.id)?.lastShownAt ?? ''
  return candidates.reduce((oldest, fact) => (lastShown(fact) < lastShown(oldest) ? fact : oldest))
}

export interface PickNextCardParams {
  /** Facts within the user's currently-selected domains only. */
  pool: Fact[]
  domains: Domain[]
  weights: Partial<Record<Domain, number>>
  seenByFactId: ReadonlyMap<string, SeenFact>
  /** Facts already queued for an upcoming slot, so this pick doesn't repeat them. */
  excludeIds: ReadonlySet<string>
  now?: number
}

/**
 * The single entry point the feed calls per queue slot. Always exactly
 * one of the three branches above runs — never an accidental fallthrough
 * baked into how the random picker happens to be written:
 *
 *   1. Pool exhausted?      → fallback (branch 3, no label)
 *   2. Dice roll hits?      → resurface (branch 2, "Remember this?")
 *   3. Otherwise            → normal (branch 1)
 */
export function pickNextCard(params: PickNextCardParams): QueuedCard | null {
  const { pool, domains, weights, seenByFactId, excludeIds, now = Date.now() } = params
  const seenIds = new Set(seenByFactId.keys())

  if (isPoolExhausted(pool, seenIds)) {
    const fact = pickFallbackCard(pool, seenByFactId, excludeIds)
    return fact ? { fact, source: 'fallback' } : null
  }

  if (Math.random() < RESURFACE_CHANCE) {
    const fact = pickResurfaceCandidate(pool, seenByFactId, excludeIds, now)
    if (fact) return { fact, source: 'resurfaced' }
  }

  const fact = pickNormalCard(pool, domains, weights, new Set([...excludeIds, ...seenIds]))
  return fact ? { fact, source: 'normal' } : null
}
