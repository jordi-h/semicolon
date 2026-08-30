import { describe, expect, it } from 'vitest'

import {
  RESURFACE_MIN_AGE_MS,
  factTagWeight,
  isPoolExhausted,
  pickFallbackCard,
  pickNextCard,
  pickNormalCard,
  pickResurfaceCandidate,
  weightedRandomPick,
} from './pickNextFact'
import type { Fact, SeenFact } from '@/lib/types'

function makeFacts(domain: Fact['domain'], count: number): Fact[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${domain}-${i}`,
    domain,
    hook: `hook ${i}`,
    fact: `fact ${i}`,
    tags: [],
  }))
}

function seenAt(iso: string): SeenFact {
  return { factId: 'unused', firstSeenAt: iso, lastShownAt: iso }
}

const DAY_MS = 24 * 60 * 60 * 1000

describe('weightedRandomPick', () => {
  it('always picks the only item', () => {
    expect(weightedRandomPick([42], () => 1)).toBe(42)
  })

  it('never picks a zero-weight item when a positive-weight one exists', () => {
    const items = ['zero', 'positive']
    for (let i = 0; i < 50; i++) {
      expect(weightedRandomPick(items, (item) => (item === 'zero' ? 0 : 1))).toBe('positive')
    }
  })
})

describe('isPoolExhausted', () => {
  it('is false for an empty pool', () => {
    expect(isPoolExhausted([], new Set())).toBe(false)
  })

  it('is false when at least one fact is unseen', () => {
    const pool = makeFacts('science', 3)
    const seen = new Set([pool[0].id, pool[1].id])
    expect(isPoolExhausted(pool, seen)).toBe(false)
  })

  it('is true once every fact in the pool has been seen', () => {
    const pool = makeFacts('science', 3)
    const seen = new Set(pool.map((f) => f.id))
    expect(isPoolExhausted(pool, seen)).toBe(true)
  })
})

describe('factTagWeight', () => {
  const tagged = (tags: string[]): Fact => ({
    id: 'x',
    domain: 'science',
    hook: 'h',
    fact: 'f',
    tags,
  })

  it('is neutral for an untagged fact', () => {
    expect(factTagWeight(tagged([]), new Map([['physics', 0.2]]))).toBe(1)
  })

  it('is neutral for tags with no signal yet', () => {
    expect(factTagWeight(tagged(['unknown']), new Map())).toBe(1)
  })

  it('averages rather than multiplies, so extra tags are not a penalty', () => {
    const weights = new Map([
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ])
    // Multiplying would give 8; averaging keeps it comparable to a
    // single-tag fact with the same enthusiasm.
    expect(factTagWeight(tagged(['a', 'b', 'c']), weights)).toBe(2)
  })

  it('lets a disliked tag pull a fact below neutral', () => {
    const weights = new Map([['chemistry', 0.2]])
    expect(factTagWeight(tagged(['chemistry']), weights)).toBeLessThan(1)
  })

  it('blends liked and disliked tags on the same fact', () => {
    const weights = new Map([
      ['astronomy', 2.0],
      ['chemistry', 0.2],
    ])
    const blended = factTagWeight(tagged(['astronomy', 'chemistry']), weights)
    expect(blended).toBeCloseTo(1.1)
  })
})

describe('pickNormalCard tag weighting', () => {
  /** Two facts in one domain, identical except for their tag. */
  const pool: Fact[] = [
    { id: 'liked', domain: 'science', hook: 'h', fact: 'f', tags: ['astronomy'] },
    { id: 'disliked', domain: 'science', hook: 'h', fact: 'f', tags: ['chemistry'] },
  ]

  it('strongly favours the fact whose tag the user likes', () => {
    const tagWeights = new Map([
      ['astronomy', 2.5],
      ['chemistry', 0.15],
    ])
    let likedCount = 0
    for (let i = 0; i < 400; i++) {
      const fact = pickNormalCard(pool, ['science'], {}, new Set(), tagWeights)
      if (fact?.id === 'liked') likedCount++
    }
    // 2.5 vs 0.15 is a ~94% share; allow wide slack for randomness.
    expect(likedCount).toBeGreaterThan(300)
  })

  it('still returns a disliked-tag fact when it is the only one left', () => {
    const tagWeights = new Map([['chemistry', 0.15]])
    const fact = pickNormalCard(pool, ['science'], {}, new Set(['liked']), tagWeights)
    expect(fact?.id).toBe('disliked')
  })

  it('is unbiased when no tag signal exists', () => {
    let likedCount = 0
    for (let i = 0; i < 400; i++) {
      const fact = pickNormalCard(pool, ['science'], {}, new Set(), new Map())
      if (fact?.id === 'liked') likedCount++
    }
    expect(likedCount).toBeGreaterThan(140)
    expect(likedCount).toBeLessThan(260)
  })
})

describe('pickNormalCard (branch 1)', () => {
  it('never returns an excluded fact', () => {
    const pool = makeFacts('science', 4)
    const excluded = new Set([pool[0].id, pool[1].id, pool[2].id])
    for (let i = 0; i < 20; i++) {
      const fact = pickNormalCard(pool, ['science'], {}, excluded)
      expect(fact?.id).toBe(pool[3].id)
    }
  })

  it('only draws from the requested domains', () => {
    const pool = [...makeFacts('science', 3), ...makeFacts('history', 3)]
    for (let i = 0; i < 20; i++) {
      const fact = pickNormalCard(pool, ['science'], {}, new Set())
      expect(fact?.domain).toBe('science')
    }
  })

  it('returns null once every candidate is excluded', () => {
    const pool = makeFacts('science', 2)
    const excluded = new Set(pool.map((f) => f.id))
    expect(pickNormalCard(pool, ['science'], {}, excluded)).toBeNull()
  })
})

describe('pickResurfaceCandidate (branch 2)', () => {
  it('only offers facts first seen more than a week ago', () => {
    const pool = makeFacts('science', 2)
    const now = Date.now()
    const seenByFactId = new Map([
      [pool[0].id, seenAt(new Date(now - 8 * DAY_MS).toISOString())], // eligible
      [pool[1].id, seenAt(new Date(now - 2 * DAY_MS).toISOString())], // too recent
    ])

    for (let i = 0; i < 20; i++) {
      expect(pickResurfaceCandidate(pool, seenByFactId, new Set(), now)?.id).toBe(pool[0].id)
    }
  })

  it('returns null when no fact is old enough yet', () => {
    const pool = makeFacts('science', 2)
    const now = Date.now()
    const seenByFactId = new Map([
      [pool[0].id, seenAt(new Date(now - DAY_MS).toISOString())],
      [pool[1].id, seenAt(new Date(now - RESURFACE_MIN_AGE_MS + 1000).toISOString())],
    ])
    expect(pickResurfaceCandidate(pool, seenByFactId, new Set(), now)).toBeNull()
  })

  it('ignores facts that have never been seen', () => {
    const pool = makeFacts('science', 1)
    expect(pickResurfaceCandidate(pool, new Map(), new Set())).toBeNull()
  })

  it('respects excludeIds even when eligible', () => {
    const pool = makeFacts('science', 1)
    const now = Date.now()
    const seenByFactId = new Map([[pool[0].id, seenAt(new Date(now - 8 * DAY_MS).toISOString())]])
    expect(pickResurfaceCandidate(pool, seenByFactId, new Set([pool[0].id]), now)).toBeNull()
  })
})

describe('pickFallbackCard (branch 3)', () => {
  it('picks the fact with the oldest last_shown_at, not randomly', () => {
    const pool = makeFacts('science', 3)
    const seenByFactId = new Map([
      [pool[0].id, seenAt('2026-01-03T00:00:00.000Z')],
      [pool[1].id, seenAt('2026-01-01T00:00:00.000Z')], // oldest
      [pool[2].id, seenAt('2026-01-02T00:00:00.000Z')],
    ])
    expect(pickFallbackCard(pool, seenByFactId, new Set())?.id).toBe(pool[1].id)
  })

  it('rotates to the next-oldest once the oldest is excluded (simulating a bumped last_shown_at)', () => {
    const pool = makeFacts('science', 3)
    const seenByFactId = new Map([
      [pool[0].id, seenAt('2026-01-03T00:00:00.000Z')],
      [pool[1].id, seenAt('2026-01-01T00:00:00.000Z')],
      [pool[2].id, seenAt('2026-01-02T00:00:00.000Z')],
    ])
    const fact = pickFallbackCard(pool, seenByFactId, new Set([pool[1].id]))
    expect(fact?.id).toBe(pool[2].id)
  })

  it('returns null once every candidate is excluded', () => {
    const pool = makeFacts('science', 1)
    expect(pickFallbackCard(pool, new Map(), new Set([pool[0].id]))).toBeNull()
  })
})

describe('pickNextCard (orchestrator)', () => {
  it('uses the fallback branch once the pool is exhausted, even if the dice roll would hit', () => {
    const pool = makeFacts('science', 2)
    const now = Date.now()
    const seenByFactId = new Map([
      [pool[0].id, seenAt(new Date(now - 8 * DAY_MS).toISOString())],
      [pool[1].id, seenAt(new Date(now - 8 * DAY_MS).toISOString())],
    ])
    const card = pickNextCard({
      pool,
      domains: ['science'],
      weights: {},
      seenByFactId,
      excludeIds: new Set(),
      now,
    })
    expect(card?.source).toBe('fallback')
  })

  it('uses the normal branch when nothing is seen yet', () => {
    const pool = makeFacts('science', 5)
    const card = pickNextCard({
      pool,
      domains: ['science'],
      weights: {},
      seenByFactId: new Map(),
      excludeIds: new Set(),
    })
    expect(card?.source).toBe('normal')
  })

  it('returns null when the pool truly has nothing left to offer', () => {
    const pool = makeFacts('science', 1)
    const seenByFactId = new Map([[pool[0].id, seenAt(new Date().toISOString())]])
    const card = pickNextCard({
      pool,
      domains: ['science'],
      weights: {},
      seenByFactId,
      excludeIds: new Set([pool[0].id]),
    })
    expect(card).toBeNull()
  })
})
