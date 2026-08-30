import type { Fact } from '@/lib/types'
import science from './science.json'
import technology from './technology.json'
import history from './history.json'
import geography from './geography.json'
import culture from './culture.json'
import space from './space.json'
import language from './language.json'
import psychology from './psychology.json'
import art from './art.json'
import food from './food.json'
import sports from './sports.json'
import law from './law.json'

/**
 * All curated facts, hand-seeded per domain in src/data/facts/*.json.
 * This is the single source of truth for content: scripts/seed.ts loads
 * it to populate Supabase, and the app falls back to it directly when no
 * Supabase project is configured (see src/lib/api).
 */
export const allFacts: Fact[] = [
  ...(science as Fact[]),
  ...(technology as Fact[]),
  ...(history as Fact[]),
  ...(geography as Fact[]),
  ...(culture as Fact[]),
  ...(space as Fact[]),
  ...(language as Fact[]),
  ...(psychology as Fact[]),
  ...(art as Fact[]),
  ...(food as Fact[]),
  ...(sports as Fact[]),
  ...(law as Fact[]),
]
