import { History, Search } from 'lucide-react'

import { HeartButton } from '@/features/feed/components/HeartButton'
import { ReactionButtons } from '@/features/feed/components/ReactionButtons'
import { factSearchUrl } from '@/features/feed/lib/factSearchUrl'
import { ShareButton } from '@/features/share/ShareButton'
import { domainGradient, domainTint } from '@/lib/domainTheme'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { DOMAIN_EMOJI, DOMAIN_LABELS, type Fact, type Reaction } from '@/lib/types'

interface FactCardProps {
  fact: Fact
  saved: boolean
  onToggleSave: () => void
  onReact: (reaction: Reaction) => void
  active: boolean
  /** True only for the deliberate "resurface an old fact" branch — never
   * set for the exhausted-pool fallback, which stays unlabeled. */
  resurfaced?: boolean
}

export function FactCard({
  fact,
  saved,
  onToggleSave,
  onReact,
  active,
  resurfaced = false,
}: FactCardProps) {
  const { locale, t } = useLocale()

  return (
    <article
      className="relative flex h-full w-full flex-col justify-end overflow-hidden p-6 pb-10 text-white sm:rounded-2xl"
      style={{ background: domainGradient(fact.domain) }}
      aria-hidden={!active}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="relative z-10 mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-body-sm font-medium text-white/85">
          <span aria-hidden="true">{DOMAIN_EMOJI[fact.domain]}</span>
          <span>{DOMAIN_LABELS[locale][fact.domain]}</span>
        </div>
        {resurfaced && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-label uppercase text-white backdrop-blur-sm"
            style={{ background: domainTint(fact.domain, 0.35) }}
          >
            <History size={13} />
            {t('fact.rememberThis')}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-1 items-center gap-3">
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="font-display text-display-hook text-balance">{fact.hook}</h2>
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

        <div className="flex flex-col items-center gap-4">
          <HeartButton saved={saved} onToggle={onToggleSave} />
          <ReactionButtons onReact={onReact} />
          <ShareButton fact={fact} />
        </div>
      </div>
    </article>
  )
}
