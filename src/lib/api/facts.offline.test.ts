import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Fact } from '@/lib/types'

/**
 * The offline path for the feed: when Supabase is unreachable,
 * fetchFactsByDomains must serve whatever was cached on a previous
 * online visit rather than surfacing an error or an empty pool — and
 * must still throw when there's genuinely nothing cached, so the feed
 * shows a real error instead of pretending the user's domains are empty.
 */

const cacheGet = vi.fn()
const cacheSet = vi.fn()
const from = vi.fn()

vi.mock('@/lib/offlineCache', () => ({
  cacheGet: (...args: unknown[]) => cacheGet(...args),
  cacheSet: (...args: unknown[]) => cacheSet(...args),
}))

vi.mock('@/lib/supabaseClient', () => ({
  isSupabaseConfigured: true,
  get supabase() {
    return { from: (...args: unknown[]) => from(...args) }
  },
}))

const { fetchFactsByDomains } = await import('@/lib/api/facts')

const row = (id: string) => ({
  id,
  domain: 'science',
  hook: `hook ${id}`,
  fact: `fact ${id}`,
  why_it_matters: null,
  tags: ['physics'],
  source_url: null,
})

/**
 * Minimal stand-in for Supabase's query builder. The facts query ends at
 * `.in()`; the fact_translations query (non-English locales only) adds an
 * `.eq()` first, and is stubbed to return no translations so facts fall
 * back to their English text — irrelevant to what these tests assert.
 */
function respondWith(result: { data?: unknown; error?: unknown }) {
  from.mockImplementation((table: string) => ({
    select: () =>
      table === 'fact_translations'
        ? { eq: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }
        : { in: () => Promise.resolve(result) },
  }))
}

beforeEach(() => {
  cacheGet.mockReset()
  cacheSet.mockReset()
  from.mockReset()
})

describe('fetchFactsByDomains offline behaviour', () => {
  it('caches a bounded buffer after a successful online fetch', async () => {
    respondWith({ data: [row('science-1'), row('science-2')], error: null })
    cacheGet.mockResolvedValue(null)

    const facts = await fetchFactsByDomains(['science'], 'en')

    expect(facts).toHaveLength(2)
    expect(cacheSet).toHaveBeenCalledTimes(1)
    const [key, cached] = cacheSet.mock.calls[0] as [string, Fact[]]
    expect(key).toContain('science')
    expect(key).toContain('en')
    expect(cached).toHaveLength(2)
  })

  it('falls back to the cache when the network fails', async () => {
    respondWith({ data: null, error: new Error('offline') })
    const cached: Partial<Fact>[] = [{ id: 'science-9', hook: 'cached hook' }]
    cacheGet.mockResolvedValue(cached)

    const facts = await fetchFactsByDomains(['science'], 'en')

    expect(facts).toEqual(cached)
    expect(cacheGet).toHaveBeenCalledTimes(1)
  })

  it('rethrows when offline with nothing cached, rather than reporting an empty pool', async () => {
    respondWith({ data: null, error: new Error('offline') })
    cacheGet.mockResolvedValue(null)

    await expect(fetchFactsByDomains(['science'], 'en')).rejects.toThrow()
  })

  it('rethrows when the cache exists but is empty', async () => {
    respondWith({ data: null, error: new Error('offline') })
    cacheGet.mockResolvedValue([])

    await expect(fetchFactsByDomains(['science'], 'en')).rejects.toThrow()
  })

  it('keys the cache per domain-set and locale, so selections do not collide', async () => {
    respondWith({ data: [row('science-1')], error: null })
    cacheGet.mockResolvedValue(null)

    await fetchFactsByDomains(['science', 'history'], 'en')
    await fetchFactsByDomains(['history', 'science'], 'en')
    await fetchFactsByDomains(['science', 'history'], 'fr')

    const keys = cacheSet.mock.calls.map((c) => c[0] as string)
    // Domain order must not matter — same selection, same key.
    expect(keys[0]).toBe(keys[1])
    // Locale must matter — different translations, different key.
    expect(keys[2]).not.toBe(keys[0])
  })

  it('does not touch the network or cache for an empty domain selection', async () => {
    const facts = await fetchFactsByDomains([], 'en')
    expect(facts).toEqual([])
    expect(from).not.toHaveBeenCalled()
    expect(cacheGet).not.toHaveBeenCalled()
  })
})
