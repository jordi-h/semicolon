import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ShareButton } from '@/features/share/ShareButton'
import { factSearchUrl } from '@/features/feed/lib/factSearchUrl'
import { fetchFactsByIds } from '@/lib/api/facts'
import { DOMAIN_GRADIENTS } from '@/lib/domainTheme'
import { DOMAIN_EMOJI, DOMAIN_LABELS, type Fact } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Public, unauthenticated landing page for a shared fact link
 * (factShareUrl). Deliberately not wrapped in ProtectedRoute — this is
 * the page a new visitor lands on from a shared link, before they have
 * an account, so it has to work without one.
 */
export function SharedFactPage() {
  const { factId } = useParams<{ factId: string }>()
  const [fact, setFact] = useState<Fact | null>(null)
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading')

  useEffect(() => {
    if (!factId) {
      setStatus('not-found')
      return
    }
    let cancelled = false
    setStatus('loading')
    fetchFactsByIds([factId]).then((facts) => {
      if (cancelled) return
      if (facts[0]) {
        setFact(facts[0])
        setStatus('found')
      } else {
        setStatus('not-found')
      }
    })
    return () => {
      cancelled = true
    }
  }, [factId])

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === 'not-found' || !fact) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo className="h-14 w-14 rounded-2xl" />
        <p className="font-medium">This fact couldn't be found.</p>
        <Button asChild>
          <Link to="/">Open semicolon</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <article
        className={cn(
          'relative flex flex-1 flex-col justify-end overflow-hidden bg-gradient-to-br p-6 pb-8 text-white sm:rounded-t-2xl',
          DOMAIN_GRADIENTS[fact.domain],
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/10" />

        <div className="relative z-10 mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
          <span aria-hidden="true">{DOMAIN_EMOJI[fact.domain]}</span>
          <span>{DOMAIN_LABELS[fact.domain]}</span>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{fact.hook}</h1>
          <p className="text-lg leading-relaxed text-white/95">{fact.fact}</p>
          {fact.whyItMatters && (
            <p className="border-l-2 border-white/40 pl-3 text-sm italic text-white/75">
              Why it matters: {fact.whyItMatters}
            </p>
          )}
          <a
            href={factSearchUrl(fact)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Search size={14} />
            Dive deeper
          </a>
        </div>

        <div className="relative z-10 mt-6 flex justify-end">
          <ShareButton fact={fact} size="lg" />
        </div>
      </article>

      <div className="flex flex-col items-center gap-3 border-t bg-background p-6 text-center sm:rounded-b-2xl">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 rounded-lg" />
          <span className="font-bold">semicolon</span>
        </div>
        <p className="text-sm text-muted-foreground">
          A TikTok-style feed of bite-sized knowledge — a new fact every swipe.
        </p>
        <Button asChild className="w-full">
          <Link to="/">Get semicolon</Link>
        </Button>
      </div>
    </div>
  )
}
