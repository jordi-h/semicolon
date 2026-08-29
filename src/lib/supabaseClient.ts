import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True once real Supabase credentials are provided via .env.local. Until
 * then, the data-access layer in src/lib/api falls back to the local
 * seed dataset + localStorage so the app is runnable out of the box.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
