import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Domain, Fact, Locale } from '@/lib/types'

/**
 * The bundled seed dataset, loaded lazily and only in the no-Supabase
 * local-dev fallback. It's ~2.8 MB with every locale's translations —
 * far too big to ship to production clients, which always read facts
 * from Supabase instead. A dynamic import keeps it in its own chunk
 * that real users never download (and keeps the main bundle under
 * Workbox's precache limit).
 */
async function loadLocalFacts(): Promise<Fact[]> {
  const { allFacts } = await import('@/data/facts')
  return allFacts
}

interface FactRow {
  id: string
  domain: string
  hook: string
  fact: string
  why_it_matters: string | null
  tags: string[]
  source_url: string | null
}

interface FactTranslationRow {
  fact_id: string
  locale: string
  hook: string
  fact: string
  why_it_matters: string | null
}

function rowToFact(row: FactRow): Fact {
  return {
    id: row.id,
    domain: row.domain as Domain,
    hook: row.hook,
    fact: row.fact,
    whyItMatters: row.why_it_matters ?? undefined,
    tags: row.tags,
    sourceUrl: row.source_url ?? undefined,
  }
}

/** Resolves a fact's text to the given locale, falling back to the
 * English original (already on `fact`) when no translation exists —
 * e.g. content seeded before that locale was added. */
function localizeFact(fact: Fact, locale: Locale): Fact {
  if (locale === 'en') return fact
  const translation = fact.translations?.[locale]
  if (!translation) return fact
  return {
    ...fact,
    hook: translation.hook,
    fact: translation.fact,
    whyItMatters: translation.whyItMatters ?? fact.whyItMatters,
  }
}

async function applyServerTranslations(facts: Fact[], locale: Locale): Promise<Fact[]> {
  if (locale === 'en' || facts.length === 0) return facts

  const { data, error } = await supabase!
    .from('fact_translations')
    .select('*')
    .eq('locale', locale)
    .in(
      'fact_id',
      facts.map((f) => f.id),
    )
  if (error) throw error

  const byFactId = new Map((data as FactTranslationRow[]).map((row) => [row.fact_id, row]))
  return facts.map((f) => {
    const translation = byFactId.get(f.id)
    if (!translation) return f
    return {
      ...f,
      hook: translation.hook,
      fact: translation.fact,
      whyItMatters: translation.why_it_matters ?? f.whyItMatters,
    }
  })
}

export async function fetchFactsByDomains(domains: Domain[], locale: Locale): Promise<Fact[]> {
  if (domains.length === 0) return []

  if (!isSupabaseConfigured) {
    const allFacts = await loadLocalFacts()
    return allFacts.filter((f) => domains.includes(f.domain)).map((f) => localizeFact(f, locale))
  }

  const { data, error } = await supabase!.from('facts').select('*').in('domain', domains)
  if (error) throw error
  return applyServerTranslations((data as FactRow[]).map(rowToFact), locale)
}

export async function fetchFactsByIds(ids: string[], locale: Locale): Promise<Fact[]> {
  if (ids.length === 0) return []

  if (!isSupabaseConfigured) {
    const allFacts = await loadLocalFacts()
    const idSet = new Set(ids)
    return allFacts.filter((f) => idSet.has(f.id)).map((f) => localizeFact(f, locale))
  }

  const { data, error } = await supabase!.from('facts').select('*').in('id', ids)
  if (error) throw error
  return applyServerTranslations((data as FactRow[]).map(rowToFact), locale)
}
