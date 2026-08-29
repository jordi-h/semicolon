import { describe, expect, it } from 'vitest'

import { en } from '@/lib/i18n/en'
import { es } from '@/lib/i18n/es'
import { fr } from '@/lib/i18n/fr'
import { nl } from '@/lib/i18n/nl'
import type { TranslationKey } from '@/lib/i18n/en'

const LOCALE_DICTS = { fr, nl, es } as const

describe('every locale dictionary has exactly the same keys as English', () => {
  const englishKeys = Object.keys(en).sort()

  for (const [locale, dict] of Object.entries(LOCALE_DICTS)) {
    it(`${locale} has no missing or extra keys`, () => {
      const localeKeys = Object.keys(dict).sort()
      expect(localeKeys).toEqual(englishKeys)
    })

    it(`${locale} has no empty values`, () => {
      const empty = Object.entries(dict).filter(([, value]) => !value.trim())
      expect(empty).toEqual([])
    })
  }
})

/**
 * Keys that render inside fixed, narrow UI chrome (a pill, a caption
 * under a full-bleed card, an inline badge) rather than free-flowing
 * body text — these are the ones a longer translation can actually
 * overflow off-screen. Budgets are the longest current value across all
 * four locales, plus a little headroom for future rewording; they are
 * NOT meant to be "same length as English", since translations
 * legitimately run longer or shorter per language.
 *
 * feed.scrollHint has its own responsive wrap/shrink safeguard in
 * FeedStack.tsx too — this test is the first line of defense so a
 * regression is caught at PR time, not by a screenshot.
 */
const TIGHT_SPACE_BUDGETS: Partial<Record<TranslationKey, number>> = {
  'feed.scrollHint': 30,
  'fact.rememberThis': 28,
  'common.close': 15,
  'streak.dayLabel': 12,
  'streak.daysLabel': 12,
}

describe('tight-space UI strings stay short across every locale', () => {
  const allDicts = { en, ...LOCALE_DICTS }

  for (const [key, budget] of Object.entries(TIGHT_SPACE_BUDGETS) as [TranslationKey, number][]) {
    for (const [locale, dict] of Object.entries(allDicts)) {
      it(`${key} (${locale}) is at most ${budget} characters`, () => {
        expect(
          dict[key].length,
          `"${dict[key]}" is ${dict[key].length} chars, over the ${budget}-char budget for ${key}`,
        ).toBeLessThanOrEqual(budget)
      })
    }
  }
})
