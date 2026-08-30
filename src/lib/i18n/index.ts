import { en, type TranslationKey } from '@/lib/i18n/en'
import { es } from '@/lib/i18n/es'
import { fr } from '@/lib/i18n/fr'
import { nl } from '@/lib/i18n/nl'
import { LOCALES, type Locale } from '@/lib/types'

export type { TranslationKey } from '@/lib/i18n/en'

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, fr, nl, es }

const GUEST_LOCALE_KEY = 'semico:locale'

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** Best guess at the right locale before any preferences have loaded:
 * a locale the user picked previously on this device, else their
 * browser's language if we support it, else English. */
export function detectInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(GUEST_LOCALE_KEY)
    if (stored && isLocale(stored)) return stored
  } catch {
    // localStorage can throw in private-browsing/full-storage situations.
  }

  const browserLang = window.navigator.language?.slice(0, 2)
  if (browserLang && isLocale(browserLang)) return browserLang

  return 'en'
}

export function persistGuestLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(GUEST_LOCALE_KEY, locale)
  } catch {
    // Same as above — non-fatal if storage isn't available.
  }
}
