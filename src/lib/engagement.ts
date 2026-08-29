import type { DomainAffinity, Reaction, UserStats } from '@/lib/types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Below this dwell time, a skip counts as a disinterest signal. */
const FAST_SKIP_MS = 2500
/** Around this dwell time or above, a skip counts as genuine engagement. */
const ENGAGED_DWELL_MS = 6000

/**
 * Turns one domain's rolling engagement signal into a feed weight. No ML —
 * just a bounded multiplier: fast skips and "less like this" pull it down,
 * lingering and "more like this" push it up. New domains stay neutral (1)
 * until we have a few data points.
 */
export function computeDomainWeight(affinity: DomainAffinity | undefined): number {
  if (!affinity || affinity.cardsSeen === 0) return 1

  const dwellFactor = clamp(
    0.6 + 0.4 * ((affinity.avgDwellMs - FAST_SKIP_MS) / (ENGAGED_DWELL_MS - FAST_SKIP_MS)),
    0.4,
    1.6,
  )
  const reactionFactor = clamp(1 + affinity.reactionScore * 0.15, 0.3, 2)

  return clamp(dwellFactor * reactionFactor, 0.15, 2.5)
}

/** Rolling update to a domain's affinity after one more card is shown. */
export function updateDomainAffinity(
  previous: Pick<DomainAffinity, 'avgDwellMs' | 'reactionScore' | 'cardsSeen'>,
  dwellMs: number,
  reaction?: Reaction,
): Pick<DomainAffinity, 'avgDwellMs' | 'reactionScore' | 'cardsSeen'> {
  const cardsSeen = previous.cardsSeen + 1
  const avgDwellMs = (previous.avgDwellMs * previous.cardsSeen + dwellMs) / cardsSeen
  const reactionScore =
    previous.reactionScore + (reaction === 'more' ? 1 : reaction === 'less' ? -1 : 0)

  return { avgDwellMs, reactionScore, cardsSeen }
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

/**
 * Updates streak counters for a new day of activity. Safe to call multiple
 * times in the same day (idempotent) — only advances the streak the first
 * time a user is active on a given calendar date.
 */
export function applyDailyActivity(
  previous: Pick<UserStats, 'currentStreak' | 'longestStreak' | 'lastActiveDate'>,
  nowISO: string = new Date().toISOString(),
): Pick<UserStats, 'currentStreak' | 'longestStreak' | 'lastActiveDate'> {
  const today = toDateOnly(nowISO)

  if (previous.lastActiveDate === today) {
    return { ...previous, lastActiveDate: today }
  }

  const gap = previous.lastActiveDate ? daysBetween(previous.lastActiveDate, today) : null
  const currentStreak = gap === 1 ? previous.currentStreak + 1 : 1
  const longestStreak = Math.max(previous.longestStreak, currentStreak)

  return { currentStreak, longestStreak, lastActiveDate: today }
}
