import { Heart, Search } from 'lucide-react'

import { factSearchUrl } from '@/features/feed/lib/factSearchUrl'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { DOMAIN_EMOJI, DOMAIN_LABELS, type Fact } from '@/lib/types'

interface SavedFactCardProps {
  fact: Fact
  onUnsave: () => void
}

export function SavedFactCard({ fact, onUnsave }: SavedFactCardProps) {
  const { locale, t } = useLocale()

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span aria-hidden="true">{DOMAIN_EMOJI[fact.domain]}</span>
          {DOMAIN_LABELS[locale][fact.domain]}
        </div>
        <button
          type="button"
          onClick={onUnsave}
          aria-label={t('heart.remove')}
          className="text-red-500 hover:text-red-600"
        >
          <Heart size={18} className="fill-red-500" />
        </button>
      </div>
      <h3 className="font-semibold">{fact.hook}</h3>
      <p className="text-sm text-muted-foreground">{fact.fact}</p>
      <a
        href={factSearchUrl(fact, locale)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
      >
        <Search size={12} />
        {t('fact.diveDeeper')}
      </a>
    </div>
  )
}
