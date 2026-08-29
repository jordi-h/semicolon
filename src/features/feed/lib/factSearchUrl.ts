import type { Fact, Locale } from '@/lib/types'

/**
 * Where "Dive deeper" sends the user: a fact's own sourceUrl if it has one
 * (rare — hand-curated), otherwise a web search built from the fact's
 * hook, which is written to be specific enough to work as a search query
 * on its own. This is what lets every card — not just ones with a
 * curated source — link out to more information. The search is run in
 * the fact's own (already-localized) language via `hl`, so results match
 * whatever language the card itself is showing.
 */
export function factSearchUrl(fact: Pick<Fact, 'hook' | 'sourceUrl'>, locale: Locale): string {
  if (fact.sourceUrl) return fact.sourceUrl
  return `https://www.google.com/search?q=${encodeURIComponent(fact.hook)}&hl=${locale}`
}
