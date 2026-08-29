import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { SeenFact } from '@/lib/types'

const localKey = (userId: string) => `semicolon:seen-facts:${userId}`

export async function getSeenFacts(userId: string): Promise<SeenFact[]> {
  if (!isSupabaseConfigured) {
    return readLocal<SeenFact[]>(localKey(userId), [])
  }

  const { data, error } = await supabase!
    .from('seen_facts')
    .select('fact_id, first_seen_at, last_shown_at')
    .eq('user_id', userId)
  if (error) throw error
  return data.map((row) => ({
    factId: row.fact_id,
    firstSeenAt: row.first_seen_at,
    lastShownAt: row.last_shown_at,
  }))
}

/** Records a fact's first-ever showing. A no-op if the fact already has a
 * seen_facts row — first_seen_at must never move once set. */
export async function recordFirstSeen(userId: string, factId: string): Promise<void> {
  const now = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const seen = readLocal<SeenFact[]>(localKey(userId), [])
    if (seen.some((s) => s.factId === factId)) return
    writeLocal(localKey(userId), [...seen, { factId, firstSeenAt: now, lastShownAt: now }])
    return
  }

  const { error } = await supabase!
    .from('seen_facts')
    .upsert(
      { user_id: userId, fact_id: factId, first_seen_at: now, last_shown_at: now },
      { onConflict: 'user_id,fact_id', ignoreDuplicates: true },
    )
  if (error) throw error
}

/** Bumps last_shown_at to now for a fact the user is seeing again
 * (resurfaced or served by the exhausted-pool fallback). Leaves
 * first_seen_at untouched. */
export async function bumpLastShown(userId: string, factId: string): Promise<void> {
  const now = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const seen = readLocal<SeenFact[]>(localKey(userId), [])
    writeLocal(
      localKey(userId),
      seen.map((s) => (s.factId === factId ? { ...s, lastShownAt: now } : s)),
    )
    return
  }

  const { error } = await supabase!
    .from('seen_facts')
    .update({ last_shown_at: now })
    .eq('user_id', userId)
    .eq('fact_id', factId)
  if (error) throw error
}
