import { Link } from 'react-router-dom'
import { ArrowLeft, BookHeart } from 'lucide-react'

import { SavedFactCard } from '@/features/saved/components/SavedFactCard'
import { useSavedFacts } from '@/lib/hooks/useSavedFacts'
import { useLocale } from '@/lib/i18n/LocaleContext'

export function SavedPage() {
  const { savedFacts, isLoading, unsave } = useSavedFacts()
  const { t } = useLocale()

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <Link
          to="/feed"
          aria-label={t('settings.backAriaLabel')}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-display-title">{t('saved.title')}</h1>
      </div>

      {isLoading && <p className="text-body-md text-muted-foreground">{t('saved.loading')}</p>}

      {!isLoading && savedFacts.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-ember">
            <BookHeart size={26} />
          </div>
          <p className="max-w-[26ch] text-body-md text-muted-foreground">{t('saved.empty')}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {savedFacts.map(({ fact }) => (
          <SavedFactCard key={fact.id} fact={fact} onUnsave={() => unsave(fact.id)} />
        ))}
      </div>
    </div>
  )
}
