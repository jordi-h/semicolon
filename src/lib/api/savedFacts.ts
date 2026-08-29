import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { SavedFact } from '@/lib/types'

const localKey = (userId: string) => `semicolon:saved-facts:${userId}`

export async function getSavedFacts(userId: string): Promise<SavedFact[]> {
  if (!isSupabaseConfigured) {
    return readLocal<SavedFact[]>(localKey(userId), [])
  }

  const { data, error } = await supabase!
    .from('saved_facts')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  if (error) throw error
  return data.map((row) => ({ userId: row.user_id, factId: row.fact_id, savedAt: row.saved_at }))
}

export async function saveFact(userId: string, factId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const saved = readLocal<SavedFact[]>(localKey(userId), [])
    if (saved.some((s) => s.factId === factId)) return
    writeLocal(localKey(userId), [{ userId, factId, savedAt: new Date().toISOString() }, ...saved])
    return
  }

  const { error } = await supabase!.from('saved_facts').upsert({ user_id: userId, fact_id: factId })
  if (error) throw error
}

export async function unsaveFact(userId: string, factId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const saved = readLocal<SavedFact[]>(localKey(userId), [])
    writeLocal(
      localKey(userId),
      saved.filter((s) => s.factId !== factId),
    )
    return
  }

  const { error } = await supabase!
    .from('saved_facts')
    .delete()
    .eq('user_id', userId)
    .eq('fact_id', factId)
  if (error) throw error
}
