import type { Domain, Fact } from '@/lib/types'

/** Picks one item from a weighted pool. All weights must be > 0. */
export function weightedRandomPick<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight)
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = Math.random() * total

  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return items[i]
  }
  return items[items.length - 1]
}

export interface BuildQueueResult {
  queue: Fact[]
  /** Domains whose unseen pool ran out and had to be recycled to fill this queue. */
  recycledDomains: Domain[]
}

/**
 * Builds the next `count` cards for the feed: a weighted-random domain pick
 * per slot (so more-engaging domains show up more often), then a random
 * unseen fact within that domain. A domain's seen set is only recycled
 * (allowing repeats) once every fact in it has already been shown — the
 * "no repeat until the pool is exhausted" rule from the product spec.
 */
export function buildQueue(
  pool: Fact[],
  seenIds: ReadonlySet<string>,
  domains: Domain[],
  weights: Partial<Record<Domain, number>>,
  count: number,
): BuildQueueResult {
  const byDomain = new Map<Domain, Fact[]>()
  for (const domain of domains) {
    byDomain.set(
      domain,
      pool.filter((f) => f.domain === domain),
    )
  }

  const unseenByDomain = new Map<Domain, Fact[]>()
  for (const domain of domains) {
    unseenByDomain.set(
      domain,
      (byDomain.get(domain) ?? []).filter((f) => !seenIds.has(f.id)),
    )
  }

  const queue: Fact[] = []
  const recycledDomains: Domain[] = []

  for (let i = 0; i < count; i++) {
    for (const domain of domains) {
      const remaining = unseenByDomain.get(domain) ?? []
      const total = byDomain.get(domain) ?? []
      if (remaining.length === 0 && total.length > 0) {
        unseenByDomain.set(domain, [...total])
        recycledDomains.push(domain)
      }
    }

    const available = domains.filter((d) => (unseenByDomain.get(d)?.length ?? 0) > 0)
    if (available.length === 0) break

    const domain = weightedRandomPick(available, (d) => weights[d] ?? 1)
    const candidates = unseenByDomain.get(domain)!
    const index = Math.floor(Math.random() * candidates.length)
    const [fact] = candidates.splice(index, 1)
    queue.push(fact)
  }

  return { queue, recycledDomains: [...new Set(recycledDomains)] }
}
