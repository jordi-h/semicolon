import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { detectInitialLocale, dictionaries, persistGuestLocale, type TranslationKey } from '@/lib/i18n'
import { usePreferences } from '@/lib/hooks/usePreferences'
import type { Locale } from '@/lib/types'

type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TFunction
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { preferences, savePreferences } = usePreferences()
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale())
  const hasSyncedFromServer = useRef(false)

  // Once the signed-in user's saved preference loads, adopt it as the
  // source of truth (it wins over the pre-login guest/browser guess) —
  // but only the first time, so it doesn't fight a change the user just
  // made in this same session.
  useEffect(() => {
    if (preferences && !hasSyncedFromServer.current) {
      setLocaleState(preferences.locale)
      hasSyncedFromServer.current = true
    }
  }, [preferences])

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next)
      persistGuestLocale(next)
      if (preferences) {
        savePreferences(preferences.domains, next)
      }
    },
    [preferences, savePreferences],
  )

  const t = useCallback<TFunction>(
    (key, vars) => interpolate(dictionaries[locale][key], vars),
    [locale],
  )

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
