import { Navigate, Link } from 'react-router-dom'
import { Compass, Settings } from 'lucide-react'

import { FeedStack } from '@/features/feed/components/FeedStack'
import { StreakBadge } from '@/features/feed/components/StreakBadge'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { Logo } from '@/components/Logo'
import { usePreferences } from '@/lib/hooks/usePreferences'
import { useSavedFacts } from '@/lib/hooks/useSavedFacts'
import { useStats } from '@/lib/hooks/useStats'
import { useLocale } from '@/lib/i18n/LocaleContext'

export function FeedPage() {
  const { preferences, isLoading: preferencesLoading } = usePreferences()
  const { stats } = useStats()
  const { savedIds, toggle } = useSavedFacts()
  const { t } = useLocale()

  const domains = preferences?.domains ?? []
  const {
    currentFact,
    currentCardSource,
    advance,
    undo,
    canUndo,
    isLoading,
    isEmpty,
    showExhaustionNotice,
    acknowledgeExhaustionNotice,
  } = useFeed(domains)

  if (preferencesLoading) {
    return <CenteredState />
  }

  if (!preferencesLoading && (!preferences || preferences.domains.length === 0)) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col sm:py-4">
      <header className="flex items-center justify-between px-4 py-3 sm:px-0">
        <Logo variant="full" className="h-7 w-7" />
        <div className="flex items-center gap-2">
          <StreakBadge streak={stats?.currentStreak ?? 0} />
          <Link
            to="/settings"
            aria-label={t('feed.settingsAriaLabel')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>

      <main className="relative flex-1 px-0 sm:px-0">
        {isLoading && <CenteredState />}
        {!isLoading && isEmpty && <EmptyDomainsState />}
        {!isLoading && !isEmpty && currentFact && (
          <FeedStack
            currentFact={currentFact}
            savedIds={savedIds}
            onAdvance={advance}
            onUndo={undo}
            canUndo={canUndo}
            onToggleSave={toggle}
            resurfaced={currentCardSource === 'resurfaced'}
            showExhaustionNotice={showExhaustionNotice}
            onDismissExhaustionNotice={acknowledgeExhaustionNotice}
          />
        )}
      </main>
    </div>
  )
}

function CenteredState() {
  return (
    <div className="flex h-full items-center justify-center">
      <Logo className="h-10 w-10 animate-pulse" />
    </div>
  )
}

function EmptyDomainsState() {
  const { t } = useLocale()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Compass size={26} />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-display-title">{t('feed.emptyTitle')}</p>
        <p className="text-body-md text-muted-foreground">
          {t('feed.emptyBefore')}{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2">
            {t('feed.emptyLink')}
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
