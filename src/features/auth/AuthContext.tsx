import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { getGuestId } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

export interface AuthUser {
  id: string
  email: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** False in local-dev fallback mode, where every visitor is a "guest" user
   * with no login required. True once real Supabase auth is configured. */
  authRequired: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function guestUser(): AuthUser {
  return { id: getGuestId(), email: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(isSupabaseConfigured ? null : guestUser())
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase!.auth.getSession().then(({ data }) => {
      setUser(sessionToUser(data.session))
      setLoading(false)
    })

    const { data: subscription } = supabase!.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session))
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authRequired: isSupabaseConfigured,
      async signInWithPassword(email, password) {
        if (!isSupabaseConfigured) return { error: null }
        const { error } = await supabase!.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },
      async signUpWithPassword(email, password) {
        if (!isSupabaseConfigured) return { error: null }
        const { error } = await supabase!.auth.signUp({ email, password })
        return { error: error?.message ?? null }
      },
      async signInWithMagicLink(email) {
        if (!isSupabaseConfigured) return { error: null }
        const { error } = await supabase!.auth.signInWithOtp({ email })
        return { error: error?.message ?? null }
      },
      async signOut() {
        if (!isSupabaseConfigured) return
        await supabase!.auth.signOut()
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null
  return { id: session.user.id, email: session.user.email ?? null }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
