import { describe, expect, it } from 'vitest'

import { applyDailyActivity, computeDomainWeight, updateDomainAffinity } from './engagement'

describe('computeDomainWeight', () => {
  it('is neutral for a domain with no signal yet', () => {
    expect(computeDomainWeight(undefined)).toBe(1)
    expect(
      computeDomainWeight({
        userId: 'u1',
        domain: 'science',
        avgDwellMs: 0,
        reactionScore: 0,
        cardsSeen: 0,
      }),
    ).toBe(1)
  })

  it('rewards lingering and "more like this"', () => {
    const engaged = computeDomainWeight({
      userId: 'u1',
      domain: 'science',
      avgDwellMs: 8000,
      reactionScore: 3,
      cardsSeen: 5,
    })
    const neutral = computeDomainWeight(undefined)
    expect(engaged).toBeGreaterThan(neutral)
  })

  it('penalizes fast skips and "less like this"', () => {
    const disinterested = computeDomainWeight({
      userId: 'u1',
      domain: 'science',
      avgDwellMs: 500,
      reactionScore: -3,
      cardsSeen: 5,
    })
    const neutral = computeDomainWeight(undefined)
    expect(disinterested).toBeLessThan(neutral)
  })

  it('never returns a non-positive weight', () => {
    const weight = computeDomainWeight({
      userId: 'u1',
      domain: 'science',
      avgDwellMs: 0,
      reactionScore: -100,
      cardsSeen: 10,
    })
    expect(weight).toBeGreaterThan(0)
  })
})

describe('updateDomainAffinity', () => {
  it('rolls dwell time into the running average', () => {
    const first = updateDomainAffinity({ avgDwellMs: 0, reactionScore: 0, cardsSeen: 0 }, 4000)
    expect(first).toEqual({ avgDwellMs: 4000, reactionScore: 0, cardsSeen: 1 })

    const second = updateDomainAffinity(first, 8000)
    expect(second.avgDwellMs).toBe(6000)
    expect(second.cardsSeen).toBe(2)
  })

  it('adjusts reactionScore by +1/-1 for more/less, and not at all with no reaction', () => {
    const base = { avgDwellMs: 3000, reactionScore: 0, cardsSeen: 1 }
    expect(updateDomainAffinity(base, 3000, 'more').reactionScore).toBe(1)
    expect(updateDomainAffinity(base, 3000, 'less').reactionScore).toBe(-1)
    expect(updateDomainAffinity(base, 3000).reactionScore).toBe(0)
  })
})

describe('applyDailyActivity', () => {
  const base = { currentStreak: 0, longestStreak: 0, lastActiveDate: '' }

  it('starts a streak at 1 on first activity', () => {
    const result = applyDailyActivity(base, '2026-08-29T10:00:00.000Z')
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: '2026-08-29',
    })
  })

  it('is idempotent within the same day', () => {
    const first = applyDailyActivity(base, '2026-08-29T10:00:00.000Z')
    const second = applyDailyActivity(first, '2026-08-29T22:00:00.000Z')
    expect(second.currentStreak).toBe(1)
  })

  it('advances the streak on the very next day', () => {
    const first = applyDailyActivity(base, '2026-08-29T10:00:00.000Z')
    const second = applyDailyActivity(first, '2026-08-30T09:00:00.000Z')
    expect(second.currentStreak).toBe(2)
    expect(second.longestStreak).toBe(2)
  })

  it('resets the streak after a gap of more than a day', () => {
    const first = applyDailyActivity(base, '2026-08-29T10:00:00.000Z')
    const second = applyDailyActivity(first, '2026-09-05T09:00:00.000Z')
    expect(second.currentStreak).toBe(1)
    expect(second.longestStreak).toBe(1)
  })

  it('keeps the longest streak even after a reset', () => {
    let stats = applyDailyActivity(base, '2026-08-01T10:00:00.000Z')
    stats = applyDailyActivity(stats, '2026-08-02T10:00:00.000Z')
    stats = applyDailyActivity(stats, '2026-08-03T10:00:00.000Z')
    expect(stats.longestStreak).toBe(3)

    stats = applyDailyActivity(stats, '2026-08-10T10:00:00.000Z')
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(3)
  })
})
