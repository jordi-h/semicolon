import { beforeEach, describe, expect, it, vi } from 'vitest'

import { localKeys } from '@/lib/api/localKeys'

// The local-dev branch is the one worth testing without a network: it
// exercises the same scope rules as the Supabase branch, and it is the
// path that would silently do nothing if the reset only issued deletes.
vi.mock('@/lib/supabaseClient', () => ({
  isSupabaseConfigured: false,
  supabase: null,
}))

const { resetProgress } = await import('@/lib/api/resetProgress')

const USER = 'user-1'

function seedAll() {
  localStorage.setItem(localKeys.seenFacts(USER), JSON.stringify([{ factId: 'science-001' }]))
  localStorage.setItem(localKeys.domainAffinity(USER), JSON.stringify([{ domain: 'science' }]))
  localStorage.setItem(localKeys.tagAffinity(USER), JSON.stringify([{ tag: 'space' }]))
  localStorage.setItem(localKeys.savedFacts(USER), JSON.stringify([{ factId: 'space-001' }]))
  localStorage.setItem(localKeys.preferences(USER), JSON.stringify({ domains: ['science'] }))
  localStorage.setItem(
    localKeys.stats(USER),
    JSON.stringify({
      userId: USER,
      factsLearned: 42,
      currentStreak: 5,
      longestStreak: 9,
      lastActiveDate: '2026-08-30',
      poolExhaustedNoticeShown: true,
    }),
  )
}

const read = (key: string) => localStorage.getItem(key)
const readStats = () => JSON.parse(localStorage.getItem(localKeys.stats(USER)) ?? 'null')

describe('resetProgress (local fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
    seedAll()
  })

  it('clears seen facts and both affinity signals at every scope', async () => {
    for (const scope of ['history', 'historyAndStats', 'everything'] as const) {
      localStorage.clear()
      seedAll()
      await resetProgress(USER, scope)
      expect(read(localKeys.seenFacts(USER)), scope).toBeNull()
      expect(read(localKeys.domainAffinity(USER)), scope).toBeNull()
      expect(read(localKeys.tagAffinity(USER)), scope).toBeNull()
    }
  })

  it('never touches preferences, at any scope', async () => {
    for (const scope of ['history', 'historyAndStats', 'everything'] as const) {
      localStorage.clear()
      seedAll()
      await resetProgress(USER, scope)
      expect(read(localKeys.preferences(USER)), scope).not.toBeNull()
    }
  })

  describe("scope 'history'", () => {
    it('keeps the stats counters', async () => {
      await resetProgress(USER, 'history')
      const stats = readStats()
      expect(stats.factsLearned).toBe(42)
      expect(stats.currentStreak).toBe(5)
      expect(stats.longestStreak).toBe(9)
    })

    // The flag lives in user_stats but is history state, not a
    // statistic: leaving it set would mean the one-time "you've seen
    // everything in your topics" notice never fires again, even though
    // the pool is genuinely fresh.
    it('still clears the pool-exhausted notice flag', async () => {
      await resetProgress(USER, 'history')
      expect(readStats().poolExhaustedNoticeShown).toBe(false)
    })

    it('keeps saved facts', async () => {
      await resetProgress(USER, 'history')
      expect(read(localKeys.savedFacts(USER))).not.toBeNull()
    })
  })

  describe("scope 'historyAndStats'", () => {
    it('clears the stats record', async () => {
      await resetProgress(USER, 'historyAndStats')
      expect(read(localKeys.stats(USER))).toBeNull()
    })

    it('keeps saved facts', async () => {
      await resetProgress(USER, 'historyAndStats')
      expect(read(localKeys.savedFacts(USER))).not.toBeNull()
    })
  })

  describe("scope 'everything'", () => {
    it('clears saved facts too', async () => {
      await resetProgress(USER, 'everything')
      expect(read(localKeys.savedFacts(USER))).toBeNull()
      expect(read(localKeys.stats(USER))).toBeNull()
    })
  })

  it('is safe to run when there is nothing to clear', async () => {
    localStorage.clear()
    await expect(resetProgress(USER, 'everything')).resolves.toBeUndefined()
  })
})
