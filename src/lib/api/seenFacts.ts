import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

const localKey = (userId: string) => `semicolon:seen-facts:${userId}`

export async function getSeenFactIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) {
    return new Set(readLocal<string[]>(localKey(userId), []))
  }

  const { data, error } = await supabase!.from('seen_facts').select('fact_id').eq('user_id', userId)
  if (error) throw error
  return new Set(data.map((row) => row.fact_id as string))
}

export async function markFactSeen(userId: string, factId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const seen = new Set(readLocal<string[]>(localKey(userId), []))
    seen.add(factId)
    writeLocal(localKey(userId), [...seen])
    return
  }

  const { error } = await supabase!.from('seen_facts').upsert({ user_id: userId, fact_id: factId })
  if (error) throw error
}

/** Clears the seen set for one domain once its pool is exhausted, so the
 * feed can start recycling that domain's cards. */
export async function recycleDomain(userId: string, domainFactIds: string[]): Promise<void> {
  if (!isSupabaseConfigured) {
    const seen = new Set(readLocal<string[]>(localKey(userId), []))
    for (const id of domainFactIds) seen.delete(id)
    writeLocal(localKey(userId), [...seen])
    return
  }

  const { error } = await supabase!
    .from('seen_facts')
    .delete()
    .eq('user_id', userId)
    .in('fact_id', domainFactIds)
  if (error) throw error
}
