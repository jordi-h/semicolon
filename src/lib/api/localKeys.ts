/**
 * localStorage key builders for the local-dev fallback data layer (used
 * when Supabase isn't configured — see src/lib/api/*).
 *
 * Centralised deliberately. Reset-progress has to clear exactly the keys
 * these modules write, and a key string duplicated at the reset site
 * would drift silently: the reset would report success while leaving
 * state behind, which is worse than failing loudly.
 */
export const localKeys = {
  seenFacts: (userId: string) => `semico:seen-facts:${userId}`,
  domainAffinity: (userId: string) => `semico:domain-affinity:${userId}`,
  tagAffinity: (userId: string) => `semico:tag-affinity:${userId}`,
  stats: (userId: string) => `semico:stats:${userId}`,
  savedFacts: (userId: string) => `semico:saved-facts:${userId}`,
  /** Topics + language. Deliberately NOT cleared by any reset scope:
   * it's configuration, not progress. */
  preferences: (userId: string) => `semico:preferences:${userId}`,
} as const
