import { applyDailyActivity } from '@/lib/engagement'
import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { UserStats } from '@/lib/types'

const localKey = (userId: string) => `semicolon:stats:${userId}`

const emptyStats = (userId: string): UserStats => ({
  userId,
  factsLearned: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  poolExhaustedNoticeShown: false,
})

export async function getUserStats(userId: string): Promise<UserStats> {
  if (!isSupabaseConfigured) {
    return readLocal<UserStats>(localKey(userId), emptyStats(userId))
  }

  const { data, error } = await supabase!
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return emptyStats(userId)

  return {
    userId: data.user_id,
    factsLearned: data.facts_learned,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActiveDate: data.last_active_date ?? '',
    poolExhaustedNoticeShown: data.pool_exhausted_notice_shown,
  }
}

/** Call once per new (never-before-seen) card viewed: bumps the
 * facts-learned counter and rolls the daily streak forward (idempotent
 * per calendar day). Resurfaced/fallback re-shows don't count. */
export async function recordFactLearned(userId: string): Promise<UserStats> {
  const current = await getUserStats(userId)
  const withStreak = applyDailyActivity(current)
  const next: UserStats = {
    ...current,
    ...withStreak,
    factsLearned: current.factsLearned + 1,
  }
  await saveStats(userId, next)
  return next
}

/** Marks the one-time "you've seen everything" notice as shown, so it
 * never appears again for this user. */
export async function markPoolExhaustedNoticeShown(userId: string): Promise<UserStats> {
  const current = await getUserStats(userId)
  if (current.poolExhaustedNoticeShown) return current
  const next: UserStats = { ...current, poolExhaustedNoticeShown: true }
  await saveStats(userId, next)
  return next
}

async function saveStats(userId: string, next: UserStats): Promise<void> {
  if (!isSupabaseConfigured) {
    writeLocal(localKey(userId), next)
    return
  }

  const { error } = await supabase!.from('user_stats').upsert({
    user_id: userId,
    facts_learned: next.factsLearned,
    current_streak: next.currentStreak,
    longest_streak: next.longestStreak,
    last_active_date: next.lastActiveDate,
    pool_exhausted_notice_shown: next.poolExhaustedNoticeShown,
  })
  if (error) throw error
}
