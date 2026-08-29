import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Domain, UserPreferences } from '@/lib/types'

const localKey = (userId: string) => `infiniscroll:preferences:${userId}`

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured) {
    return readLocal<UserPreferences | null>(localKey(userId), null)
  }

  const { data, error } = await supabase!
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return { userId: data.user_id, domains: data.domains, updatedAt: data.updated_at }
}

export async function saveUserPreferences(
  userId: string,
  domains: Domain[],
): Promise<UserPreferences> {
  const updatedAt = new Date().toISOString()
  const prefs: UserPreferences = { userId, domains, updatedAt }

  if (!isSupabaseConfigured) {
    writeLocal(localKey(userId), prefs)
    return prefs
  }

  const { error } = await supabase!
    .from('user_preferences')
    .upsert({ user_id: userId, domains, updated_at: updatedAt })
  if (error) throw error
  return prefs
}
