import { updateDomainAffinity } from '@/lib/engagement'
import { readLocal, writeLocal } from '@/lib/localStorage'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Reaction, TagAffinity } from '@/lib/types'

const localKey = (userId: string) => `semicolon:tag-affinity:${userId}`

export async function getTagAffinities(userId: string): Promise<TagAffinity[]> {
  if (!isSupabaseConfigured) {
    return readLocal<TagAffinity[]>(localKey(userId), [])
  }

  const { data, error } = await supabase!.from('tag_affinity').select('*').eq('user_id', userId)
  if (error) throw error
  return data.map((row) => ({
    userId: row.user_id,
    tag: row.tag,
    avgDwellMs: row.avg_dwell_ms,
    reactionScore: row.reaction_score,
    cardsSeen: row.cards_seen,
  }))
}

/**
 * Records one card view against every tag that card carries. A fact has
 * 1-3 tags, so this deliberately reads and upserts them as a single
 * batch rather than one round-trip per tag — advance() runs on every
 * swipe and must stay cheap.
 *
 * Reuses updateDomainAffinity's math: same rolling-average dwell and
 * +1/-1 reaction score, so tag weights and domain weights are directly
 * comparable and share one set of tuning constants.
 */
export async function recordTagEngagement(
  userId: string,
  tags: string[],
  dwellMs: number,
  reaction?: Reaction,
): Promise<void> {
  if (tags.length === 0) return

  const blank = { avgDwellMs: 0, reactionScore: 0, cardsSeen: 0 }

  if (!isSupabaseConfigured) {
    const all = readLocal<TagAffinity[]>(localKey(userId), [])
    const byTag = new Map(all.map((a) => [a.tag, a]))
    for (const tag of tags) {
      const updated = updateDomainAffinity(byTag.get(tag) ?? blank, dwellMs, reaction)
      byTag.set(tag, { userId, tag, ...updated })
    }
    writeLocal(localKey(userId), [...byTag.values()])
    return
  }

  const { data: existing, error: fetchError } = await supabase!
    .from('tag_affinity')
    .select('*')
    .eq('user_id', userId)
    .in('tag', tags)
  if (fetchError) throw fetchError

  const byTag = new Map(
    (existing ?? []).map((row) => [
      row.tag as string,
      {
        avgDwellMs: row.avg_dwell_ms as number,
        reactionScore: row.reaction_score as number,
        cardsSeen: row.cards_seen as number,
      },
    ]),
  )

  const rows = tags.map((tag) => {
    const updated = updateDomainAffinity(byTag.get(tag) ?? blank, dwellMs, reaction)
    return {
      user_id: userId,
      tag,
      avg_dwell_ms: updated.avgDwellMs,
      reaction_score: updated.reactionScore,
      cards_seen: updated.cardsSeen,
    }
  })

  const { error } = await supabase!.from('tag_affinity').upsert(rows)
  if (error) throw error
}
