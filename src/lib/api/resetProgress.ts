import { localKeys } from '@/lib/api/localKeys'
import { readLocal, removeLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { UserStats } from '@/lib/types'

/**
 * How much of a user's progress a reset clears. Each scope is a strict
 * superset of the one before it.
 *
 * `user_preferences` (topics + language) is never cleared by any scope:
 * it is configuration, not progress. Wiping someone's chosen topics
 * because they wanted a fresh feed would be a surprise, and it would
 * dump them back into onboarding.
 */
export type ResetScope =
  /** Everything the feed remembers about you: which cards you've seen,
   * and the engagement weights learned from how you reacted. Keeps
   * streaks, facts-learned, and saved facts. */
  | 'history'
  /** The above, plus streaks and the facts-learned counter. */
  | 'historyAndStats'
  /** The above, plus your saved (hearted) facts. */
  | 'everything'

/** Rows that constitute "what the feed knows about you". Cleared by
 * every scope — resetting seen history but keeping the affinity weights
 * would give a fresh pool still skewed by the old preferences, which is
 * not what "start over" means to anyone. */
const HISTORY_TABLES = ['seen_facts', 'domain_affinity', 'tag_affinity'] as const

/**
 * Clears the requested slice of a user's progress, in Supabase or in the
 * local-dev localStorage fallback. Throws on failure so the caller can
 * surface it rather than falsely reporting success.
 */
export async function resetProgress(userId: string, scope: ResetScope): Promise<void> {
  const clearStats = scope !== 'history'
  const clearSaved = scope === 'everything'

  if (!isSupabaseConfigured) {
    resetLocal(userId, { clearStats, clearSaved })
    return
  }

  for (const table of HISTORY_TABLES) {
    const { error } = await supabase!.from(table).delete().eq('user_id', userId)
    if (error) throw error
  }

  if (clearStats) {
    // Dropping the row is equivalent to zeroing it: getUserStats returns
    // a zeroed record when no row exists, and recordFactLearned upserts.
    const { error } = await supabase!.from('user_stats').delete().eq('user_id', userId)
    if (error) throw error
  } else {
    // pool_exhausted_notice_shown lives in user_stats but is *history*
    // state, not a statistic: it gates the one-time "you've seen
    // everything in your topics" notice. Leaving it set after clearing
    // seen_facts would mean the notice never fires again, even though
    // the pool is genuinely fresh.
    const { error } = await supabase!
      .from('user_stats')
      .update({ pool_exhausted_notice_shown: false })
      .eq('user_id', userId)
    if (error) throw error
  }

  if (clearSaved) {
    const { error } = await supabase!.from('saved_facts').delete().eq('user_id', userId)
    if (error) throw error
  }
}

function resetLocal(
  userId: string,
  { clearStats, clearSaved }: { clearStats: boolean; clearSaved: boolean },
): void {
  removeLocal(localKeys.seenFacts(userId))
  removeLocal(localKeys.domainAffinity(userId))
  removeLocal(localKeys.tagAffinity(userId))

  if (clearStats) {
    removeLocal(localKeys.stats(userId))
  } else {
    // Same reasoning as the Supabase branch: clear the notice flag only.
    const key = localKeys.stats(userId)
    const current = readLocal<UserStats | null>(key, null)
    if (current) writeLocal(key, { ...current, poolExhaustedNoticeShown: false })
  }

  if (clearSaved) removeLocal(localKeys.savedFacts(userId))
}
