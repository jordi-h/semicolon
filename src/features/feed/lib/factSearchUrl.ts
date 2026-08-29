import type { Fact } from '@/lib/types'

/**
 * Where "Dive deeper" sends the user: a fact's own sourceUrl if it has one
 * (rare — hand-curated), otherwise a web search built from the fact's
 * hook, which is written to be specific enough to work as a search query
 * on its own. This is what lets every card — not just ones with a
 * curated source — link out to more information.
 */
export function factSearchUrl(fact: Pick<Fact, 'hook' | 'sourceUrl'>): string {
  if (fact.sourceUrl) return fact.sourceUrl
  return `https://www.google.com/search?q=${encodeURIComponent(fact.hook)}`
}
