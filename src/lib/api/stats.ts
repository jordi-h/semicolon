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
  }
}

/** Call once per card viewed: bumps the facts-learned counter and rolls
 * the daily streak forward (idempotent per calendar day). */
export async function recordFactLearned(userId: string): Promise<UserStats> {
  const current = await getUserStats(userId)
  const withStreak = applyDailyActivity(current)
  const next: UserStats = {
    ...current,
    ...withStreak,
    factsLearned: current.factsLearned + 1,
  }

  if (!isSupabaseConfigured) {
    writeLocal(localKey(userId), next)
    return next
  }

  const { error } = await supabase!.from('user_stats').upsert({
    user_id: userId,
    facts_learned: next.factsLearned,
    current_streak: next.currentStreak,
    longest_streak: next.longestStreak,
    last_active_date: next.lastActiveDate,
  })
  if (error) throw error
  return next
}
