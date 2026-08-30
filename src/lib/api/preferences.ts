import { localKeys } from '@/lib/api/localKeys'

import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Domain, Locale, UserPreferences } from '@/lib/types'

const localKey = localKeys.preferences

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

  return {
    userId: data.user_id,
    domains: data.domains,
    // Rows created before the language feature shipped have no locale set.
    locale: (data.locale as Locale | null) ?? 'en',
    updatedAt: data.updated_at,
  }
}

export async function saveUserPreferences(
  userId: string,
  domains: Domain[],
  locale: Locale,
): Promise<UserPreferences> {
  const updatedAt = new Date().toISOString()
  const prefs: UserPreferences = { userId, domains, locale, updatedAt }

  if (!isSupabaseConfigured) {
    writeLocal(localKey(userId), prefs)
    return prefs
  }

  const { error } = await supabase!
    .from('user_preferences')
    .upsert({ user_id: userId, domains, locale, updated_at: updatedAt })
  if (error) throw error
  return prefs
}
