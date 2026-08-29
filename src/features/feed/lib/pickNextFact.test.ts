import { describe, expect, it } from 'vitest'

import { buildQueue, weightedRandomPick } from './pickNextFact'
import type { Fact } from '@/lib/types'

function makeFacts(domain: Fact['domain'], count: number): Fact[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${domain}-${i}`,
    domain,
    hook: `hook ${i}`,
    fact: `fact ${i}`,
    tags: [],
  }))
}

describe('weightedRandomPick', () => {
  it('always picks the only item', () => {
    expect(weightedRandomPick([42], () => 1)).toBe(42)
  })

  it('never picks a zero-weight item when a positive-weight one exists', () => {
    const items = ['zero', 'positive']
    for (let i = 0; i < 50; i++) {
      const pick = weightedRandomPick(items, (item) => (item === 'zero' ? 0 : 1))
      expect(pick).toBe('positive')
    }
  })
})

describe('buildQueue', () => {
  it('never repeats a fact until its domain pool is exhausted', () => {
    const pool = makeFacts('science', 4)
    const seen = new Set<string>()
    const shown: string[] = []

    // Pull one at a time, marking each as seen — simulates advancing
    // through the feed card by card.
    for (let i = 0; i < 4; i++) {
      const { queue } = buildQueue(pool, seen, ['science'], {}, 1)
      expect(queue).toHaveLength(1)
      const fact = queue[0]
      expect(shown).not.toContain(fact.id)
      shown.push(fact.id)
      seen.add(fact.id)
    }

    expect(new Set(shown).size).toBe(4)
  })

  it('recycles a domain once every fact in it has been seen', () => {
    const pool = makeFacts('science', 2)
    const seen = new Set(pool.map((f) => f.id))

    const { queue, recycledDomains } = buildQueue(pool, seen, ['science'], {}, 1)

    expect(recycledDomains).toEqual(['science'])
    expect(queue).toHaveLength(1)
    expect(pool.map((f) => f.id)).toContain(queue[0].id)
  })

  it('draws only from the requested domains', () => {
    const pool = [...makeFacts('science', 3), ...makeFacts('history', 3)]
    const { queue } = buildQueue(pool, new Set(), ['science'], {}, 3)

    expect(queue.every((f) => f.domain === 'science')).toBe(true)
  })

  it('returns an empty queue when the pool has no facts for the requested domains', () => {
    const { queue, recycledDomains } = buildQueue([], new Set(), ['science'], {}, 3)
    expect(queue).toEqual([])
    expect(recycledDomains).toEqual([])
  })
})
