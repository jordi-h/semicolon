import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { pickNextCard, type QueuedCard } from '@/features/feed/lib/pickNextFact'
import { getDomainAffinities, recordDomainEngagement } from '@/lib/api/domainAffinity'
import { fetchFactsByDomains } from '@/lib/api/facts'
import { bumpLastShown, getSeenFacts, recordFirstSeen } from '@/lib/api/seenFacts'
import { markPoolExhaustedNoticeShown } from '@/lib/api/stats'
import { computeDomainWeight } from '@/lib/engagement'
import { useStats } from '@/lib/hooks/useStats'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Domain, Reaction, SeenFact } from '@/lib/types'

/** How many upcoming cards to keep pre-selected. */
const QUEUE_SIZE = 5

export function useFeed(domains: Domain[]) {
  const { user } = useAuth()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const { stats, recordLearned } = useStats()
  const domainsKey = [...domains].sort().join(',')

  const poolQuery = useQuery({
    queryKey: ['facts', domainsKey, locale],
    queryFn: () => fetchFactsByDomains(domains, locale),
    enabled: domains.length > 0,
    staleTime: Infinity,
  })

  const seenQuery = useQuery({
    queryKey: ['seen-facts', user?.id],
    queryFn: () => getSeenFacts(user!.id),
    enabled: Boolean(user),
  })

  const affinityQuery = useQuery({
    queryKey: ['domain-affinity', user?.id],
    queryFn: () => getDomainAffinities(user!.id),
    enabled: Boolean(user),
  })

  const pool = poolQuery.data ?? []
  const [seenByFactId, setSeenByFactId] = useState<Map<string, SeenFact>>(new Map())
  const [queue, setQueue] = useState<QueuedCard[]>([])
  // Only the single most-recently-skipped card — undo goes back exactly
  // one step ("just to see the last one"), not an open-ended stack. It's
  // cleared the moment it's used, so undo can't be chained; advance()
  // sets a fresh one each time, so the next skip is always undoable once.
  const [lastSkipped, setLastSkipped] = useState<QueuedCard | null>(null)
  const [exhaustionNoticePending, setExhaustionNoticePending] = useState(false)
  const shownAtRef = useRef<number>(Date.now())
  const initializedRef = useRef(false)
  // Facts already recorded (seen/learned) this session — advance() must
  // not re-record a card that reappears via undo(), since
  // recordFactLearned is a plain increment, not idempotent.
  const recordedFactIdsRef = useRef<Set<string>>(new Set())

  // Seed local seen-map from the server/local-storage once it loads.
  useEffect(() => {
    if (seenQuery.data && !initializedRef.current) {
      setSeenByFactId(new Map(seenQuery.data.map((s) => [s.factId, s])))
      initializedRef.current = true
    }
  }, [seenQuery.data])

  const weights = useMemo(() => {
    const affinities = affinityQuery.data ?? []
    const byDomain = new Map(affinities.map((a) => [a.domain, a]))
    const result: Partial<Record<Domain, number>> = {}
    for (const domain of domains) {
      result[domain] = computeDomainWeight(byDomain.get(domain))
    }
    return result
    // domainsKey is the stable, deep-equal substitute for the domains array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affinityQuery.data, domainsKey])

  const ready = poolQuery.isSuccess && seenQuery.isSuccess && initializedRef.current

  // Keep the queue topped up, one explicit branch pick (pickNextCard) per slot.
  useEffect(() => {
    if (!ready || pool.length === 0) return
    if (queue.length >= QUEUE_SIZE) return

    const additions: QueuedCard[] = []
    const queuedIds = new Set(queue.map((c) => c.fact.id))

    for (let i = queue.length; i < QUEUE_SIZE; i++) {
      const card = pickNextCard({
        pool,
        domains,
        weights,
        seenByFactId,
        excludeIds: queuedIds,
      })
      if (!card) break
      additions.push(card)
      queuedIds.add(card.fact.id)
    }

    if (additions.length > 0) {
      setQueue((q) => [...q, ...additions])
      if (
        additions.some((c) => c.source === 'fallback') &&
        stats &&
        !stats.poolExhaustedNoticeShown
      ) {
        setExhaustionNoticePending(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pool.length, queue.length, seenByFactId, domainsKey, weights, stats])

  const current = queue[0] ?? null
  const currentFact = current?.fact ?? null

  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [currentFact?.id])

  function advance(reaction?: Reaction) {
    if (!current || !user) return
    const { fact, source } = current
    const dwellMs = Date.now() - shownAtRef.current
    const now = new Date().toISOString()

    setSeenByFactId((prev) => {
      const next = new Map(prev)
      const existing = next.get(fact.id)
      next.set(fact.id, {
        factId: fact.id,
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastShownAt: now,
      })
      return next
    })
    setQueue((q) => q.slice(1))
    setLastSkipped(current)

    if (!recordedFactIdsRef.current.has(fact.id)) {
      recordedFactIdsRef.current.add(fact.id)
      if (source === 'normal') {
        recordFirstSeen(user.id, fact.id).catch(() => {})
        recordLearned()
      } else {
        // Resurfaced and fallback cards are re-shows of already-seen facts —
        // only their last_shown_at moves, and they don't inflate "facts learned".
        bumpLastShown(user.id, fact.id).catch(() => {})
      }
    }

    recordDomainEngagement(user.id, fact.domain, dwellMs, reaction).then(() =>
      queryClient.invalidateQueries({ queryKey: ['domain-affinity', user.id] }),
    )
  }

  /** Brings back the fact that was just skipped — the down-swipe mirror
   * of advance(). This is "let me look at that again," not a database
   * undo: the seen/learned/engagement writes advance() already made are
   * left as-is (recordedFactIdsRef prevents them firing a second time if
   * the card is skipped again after being brought back). Only goes back
   * one step: lastSkipped is cleared immediately, so a second undo in a
   * row does nothing until the next advance() sets a new one. */
  function undo() {
    if (!user || !lastSkipped) return
    const previous = lastSkipped
    setLastSkipped(null)
    setQueue((q) => [previous, ...q])
  }

  /** Call once the UI has shown the one-time exhaustion notice, so it's
   * never shown again for this user. */
  function acknowledgeExhaustionNotice() {
    if (!user) return
    setExhaustionNoticePending(false)
    queryClient.setQueryData(['stats', user.id], (prev: typeof stats) =>
      prev ? { ...prev, poolExhaustedNoticeShown: true } : prev,
    )
    markPoolExhaustedNoticeShown(user.id).catch(() => {})
  }

  return {
    currentFact,
    currentCardSource: current?.source ?? null,
    upcoming: queue.slice(1).map((c) => c.fact),
    advance,
    undo,
    canUndo: lastSkipped !== null,
    isLoading: poolQuery.isLoading || seenQuery.isLoading,
    isEmpty: ready && pool.length === 0,
    showExhaustionNotice: exhaustionNoticePending,
    acknowledgeExhaustionNotice,
  }
}
