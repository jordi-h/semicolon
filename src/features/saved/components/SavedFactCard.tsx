import { Heart, Search } from 'lucide-react'

import { factSearchUrl } from '@/features/feed/lib/factSearchUrl'
import { DOMAIN_ACCENT } from '@/lib/domainTheme'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { DOMAIN_EMOJI, DOMAIN_LABELS, type Fact } from '@/lib/types'

interface SavedFactCardProps {
  fact: Fact
  onUnsave: () => void
}

export function SavedFactCard({ fact, onUnsave }: SavedFactCardProps) {
  const { locale, t } = useLocale()
  const accent = DOMAIN_ACCENT[fact.domain]

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border bg-card p-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-body-sm font-medium" style={{ color: accent }}>
          <span aria-hidden="true">{DOMAIN_EMOJI[fact.domain]}</span>
          {DOMAIN_LABELS[locale][fact.domain]}
        </div>
        <button
          type="button"
          onClick={onUnsave}
          aria-label={t('heart.remove')}
          className="text-ember transition-transform hover:scale-110"
        >
          <Heart size={18} className="fill-ember" />
        </button>
      </div>
      <h3 className="font-display text-lg font-bold">{fact.hook}</h3>
      <p className="text-body-md text-muted-foreground">{fact.fact}</p>
      <a
        href={factSearchUrl(fact, locale)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-1 text-body-sm text-primary hover:underline"
      >
        <Search size={12} />
        {t('fact.diveDeeper')}
      </a>
    </div>
  )
}
