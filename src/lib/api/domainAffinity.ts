import { updateDomainAffinity } from '@/lib/engagement'
import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Domain, DomainAffinity, Reaction } from '@/lib/types'

const localKey = (userId: string) => `infiniscroll:domain-affinity:${userId}`

export async function getDomainAffinities(userId: string): Promise<DomainAffinity[]> {
  if (!isSupabaseConfigured) {
    return readLocal<DomainAffinity[]>(localKey(userId), [])
  }

  const { data, error } = await supabase!.from('domain_affinity').select('*').eq('user_id', userId)
  if (error) throw error
  return data.map((row) => ({
    userId: row.user_id,
    domain: row.domain,
    avgDwellMs: row.avg_dwell_ms,
    reactionScore: row.reaction_score,
    cardsSeen: row.cards_seen,
  }))
}

export async function recordDomainEngagement(
  userId: string,
  domain: Domain,
  dwellMs: number,
  reaction?: Reaction,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const all = readLocal<DomainAffinity[]>(localKey(userId), [])
    const existing = all.find((a) => a.domain === domain)
    const updated = updateDomainAffinity(
      existing ?? { avgDwellMs: 0, reactionScore: 0, cardsSeen: 0 },
      dwellMs,
      reaction,
    )
    const next = existing
      ? all.map((a) => (a.domain === domain ? { ...a, ...updated } : a))
      : [...all, { userId, domain, ...updated }]
    writeLocal(localKey(userId), next)
    return
  }

  const { data: existing, error: fetchError } = await supabase!
    .from('domain_affinity')
    .select('*')
    .eq('user_id', userId)
    .eq('domain', domain)
    .maybeSingle()
  if (fetchError) throw fetchError

  const updated = updateDomainAffinity(
    existing
      ? {
          avgDwellMs: existing.avg_dwell_ms,
          reactionScore: existing.reaction_score,
          cardsSeen: existing.cards_seen,
        }
      : { avgDwellMs: 0, reactionScore: 0, cardsSeen: 0 },
    dwellMs,
    reaction,
  )

  const { error } = await supabase!.from('domain_affinity').upsert({
    user_id: userId,
    domain,
    avg_dwell_ms: updated.avgDwellMs,
    reaction_score: updated.reactionScore,
    cards_seen: updated.cardsSeen,
  })
  if (error) throw error
}
