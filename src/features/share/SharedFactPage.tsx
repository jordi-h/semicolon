import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ShareButton } from '@/features/share/ShareButton'
import { factSearchUrl } from '@/features/feed/lib/factSearchUrl'
import { fetchFactsByIds } from '@/lib/api/facts'
import { domainGradient } from '@/lib/domainTheme'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { DOMAIN_EMOJI, DOMAIN_LABELS, type Fact } from '@/lib/types'

/**
 * Public, unauthenticated landing page for a shared fact link
 * (factShareUrl). Deliberately not wrapped in ProtectedRoute — this is
 * the page a new visitor lands on from a shared link, before they have
 * an account, so it has to work without one.
 */
export function SharedFactPage() {
  const { factId } = useParams<{ factId: string }>()
  const { locale, t } = useLocale()
  const [fact, setFact] = useState<Fact | null>(null)
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading')

  useEffect(() => {
    if (!factId) {
      setStatus('not-found')
      return
    }
    let cancelled = false
    setStatus('loading')
    fetchFactsByIds([factId], locale).then((facts) => {
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
  }, [factId, locale])

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
        <Logo className="h-14 w-14" />
        <p className="font-medium">{t('sharedFact.notFound')}</p>
        <Button asChild>
          <Link to="/">{t('sharedFact.openSemicolon')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <article
        className="relative flex flex-1 flex-col justify-end overflow-hidden p-6 pb-8 text-white sm:rounded-t-2xl"
        style={{ background: domainGradient(fact.domain) }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/10" />

        <div className="relative z-10 mb-4 flex items-center gap-2 text-body-sm font-medium text-white/85">
          <span aria-hidden="true">{DOMAIN_EMOJI[fact.domain]}</span>
          <span>{DOMAIN_LABELS[locale][fact.domain]}</span>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="font-display text-display-hook text-balance">{fact.hook}</h1>
          <p className="text-body-lg leading-relaxed text-white/95">{fact.fact}</p>
          {fact.whyItMatters && (
            <p className="border-l-2 border-white/40 pl-3 text-body-sm italic text-white/75">
              {t('fact.whyItMatters')}: {fact.whyItMatters}
            </p>
          )}
          <a
            href={factSearchUrl(fact, locale)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-body-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Search size={14} />
            {t('fact.diveDeeper')}
          </a>
        </div>

        <div className="relative z-10 mt-6 flex justify-end">
          <ShareButton fact={fact} />
        </div>
      </article>

      <div className="flex flex-col items-center gap-3 border-t bg-background p-6 text-center sm:rounded-b-2xl">
        <Logo variant="full" className="h-8 w-8" />
        <p className="text-body-sm text-muted-foreground">{t('sharedFact.footerTagline')}</p>
        <Button asChild className="w-full">
          <Link to="/">{t('sharedFact.getSemicolon')}</Link>
        </Button>
      </div>
    </div>
  )
}
