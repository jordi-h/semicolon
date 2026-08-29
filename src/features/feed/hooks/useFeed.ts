import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { buildQueue } from '@/features/feed/lib/pickNextFact'
import { getDomainAffinities, recordDomainEngagement } from '@/lib/api/domainAffinity'
import { fetchFactsByDomains } from '@/lib/api/facts'
import { markFactSeen, recycleDomain, getSeenFactIds } from '@/lib/api/seenFacts'
import { computeDomainWeight } from '@/lib/engagement'
import { useStats } from '@/lib/hooks/useStats'
import type { Domain, Fact, Reaction } from '@/lib/types'

/** How many upcoming cards to keep pre-selected. */
const QUEUE_SIZE = 5

export function useFeed(domains: Domain[]) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { recordLearned } = useStats()
  const domainsKey = [...domains].sort().join(',')

  const poolQuery = useQuery({
    queryKey: ['facts', domainsKey],
    queryFn: () => fetchFactsByDomains(domains),
    enabled: domains.length > 0,
    staleTime: Infinity,
  })

  const seenQuery = useQuery({
    queryKey: ['seen-facts', user?.id],
    queryFn: () => getSeenFactIds(user!.id),
    enabled: Boolean(user),
  })

  const affinityQuery = useQuery({
    queryKey: ['domain-affinity', user?.id],
    queryFn: () => getDomainAffinities(user!.id),
    enabled: Boolean(user),
  })

  const pool = poolQuery.data ?? []
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [queue, setQueue] = useState<Fact[]>([])
  const shownAtRef = useRef<number>(Date.now())
  const initializedRef = useRef(false)

  // Seed local seen-set from the server/local-storage once it loads.
  useEffect(() => {
    if (seenQuery.data && !initializedRef.current) {
      setSeenIds(new Set(seenQuery.data))
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

  // Keep the queue topped up, recycling any domain whose pool runs dry.
  useEffect(() => {
    if (!ready || pool.length === 0) return
    if (queue.length >= QUEUE_SIZE) return

    const excludeIds = new Set([...seenIds, ...queue.map((f) => f.id)])
    const needed = QUEUE_SIZE - queue.length
    const { queue: additions, recycledDomains } = buildQueue(
      pool,
      excludeIds,
      domains,
      weights,
      needed,
    )

    if (recycledDomains.length > 0) {
      setSeenIds((prev) => {
        const next = new Set(prev)
        for (const domain of recycledDomains) {
          for (const f of pool) if (f.domain === domain) next.delete(f.id)
        }
        return next
      })
      for (const domain of recycledDomains) {
        const ids = pool.filter((f) => f.domain === domain).map((f) => f.id)
        if (user) recycleDomain(user.id, ids).catch(() => {})
      }
    }

    if (additions.length > 0) {
      setQueue((q) => [...q, ...additions])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pool.length, queue.length, seenIds, domainsKey, weights])

  const currentFact = queue[0] ?? null

  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [currentFact?.id])

  function advance(reaction?: Reaction) {
    if (!currentFact || !user) return
    const dwellMs = Date.now() - shownAtRef.current

    setSeenIds((prev) => new Set(prev).add(currentFact.id))
    setQueue((q) => q.slice(1))

    markFactSeen(user.id, currentFact.id).catch(() => {})
    recordDomainEngagement(user.id, currentFact.domain, dwellMs, reaction).then(() =>
      queryClient.invalidateQueries({ queryKey: ['domain-affinity', user.id] }),
    )
    recordLearned()
  }

  return {
    currentFact,
    upcoming: queue.slice(1),
    advance,
    isLoading: poolQuery.isLoading || seenQuery.isLoading,
    isEmpty: ready && pool.length === 0,
  }
}
