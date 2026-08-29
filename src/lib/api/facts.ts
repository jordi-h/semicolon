import { allFacts } from '@/data/facts'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Domain, Fact } from '@/lib/types'

interface FactRow {
  id: string
  domain: string
  hook: string
  fact: string
  why_it_matters: string | null
  tags: string[]
  source_url: string | null
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

export async function fetchFactsByDomains(domains: Domain[]): Promise<Fact[]> {
  if (domains.length === 0) return []

  if (!isSupabaseConfigured) {
    return allFacts.filter((f) => domains.includes(f.domain))
  }

  const { data, error } = await supabase!.from('facts').select('*').in('domain', domains)
  if (error) throw error
  return (data as FactRow[]).map(rowToFact)
}

export async function fetchFactsByIds(ids: string[]): Promise<Fact[]> {
  if (ids.length === 0) return []

  if (!isSupabaseConfigured) {
    const idSet = new Set(ids)
    return allFacts.filter((f) => idSet.has(f.id))
  }

  const { data, error } = await supabase!.from('facts').select('*').in('id', ids)
  if (error) throw error
  return (data as FactRow[]).map(rowToFact)
}
