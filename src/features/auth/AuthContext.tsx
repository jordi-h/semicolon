import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { getGuestId } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

export interface AuthUser {
  id: string
  email: string | null
}

/** A stable error identifier — never the raw Supabase message, which is
 * always in English. See src/lib/i18n/authErrors.ts for how the view
 * layer (which has locale access; this context deliberately doesn't,
 * see errorCode below) turns a code into a localized message. */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'user_already_exists'
  | 'weak_password'
  | 'rate_limited'
  | 'email_not_confirmed'
  | 'unknown'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** False in local-dev fallback mode, where every visitor is a "guest" user
   * with no login required. True once real Supabase auth is configured. */
  authRequired: boolean
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ errorCode: AuthErrorCode | null }>
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ errorCode: AuthErrorCode | null }>
  signInWithMagicLink: (email: string) => Promise<{ errorCode: AuthErrorCode | null }>
  signInWithOAuth: () => Promise<{ errorCode: AuthErrorCode | null }>
  signOut: () => Promise<void>
}

/** Maps a Supabase AuthError's stable `.code` to one of our own codes.
 * Deliberately NOT localized here — AuthContext/AuthProvider is rendered
 * above LocaleProvider (which itself needs auth, to load the signed-in
 * user's preferences), so it has no access to useLocale(). The view
 * layer localizes via src/lib/i18n/authErrors.ts instead. */
function toAuthErrorCode(error: { code?: string } | null): AuthErrorCode | null {
  if (!error) return null
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalid_credentials'
    case 'user_already_exists':
      return 'user_already_exists'
    case 'weak_password':
      return 'weak_password'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rate_limited'
    case 'email_not_confirmed':
      return 'email_not_confirmed'
    default:
      return 'unknown'
  }
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
        if (!isSupabaseConfigured) return { errorCode: null }
        const { error } = await supabase!.auth.signInWithPassword({ email, password })
        return { errorCode: toAuthErrorCode(error) }
      },
      async signUpWithPassword(email, password) {
        if (!isSupabaseConfigured) return { errorCode: null }
        const { error } = await supabase!.auth.signUp({ email, password })
        return { errorCode: toAuthErrorCode(error) }
      },
      async signInWithMagicLink(email) {
        if (!isSupabaseConfigured) return { errorCode: null }
        const { error } = await supabase!.auth.signInWithOtp({ email })
        return { errorCode: toAuthErrorCode(error) }
      },
      async signInWithOAuth() {
        if (!isSupabaseConfigured) return { errorCode: null }
        const { error } = await supabase!.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/feed` },
        })
        // On success this navigates the browser away to the provider, so
        // there's nothing further to do here — only a pre-redirect failure
        // (e.g. the provider isn't enabled in Supabase) reaches this line.
        return { errorCode: toAuthErrorCode(error) }
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
