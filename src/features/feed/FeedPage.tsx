import { Navigate, Link } from 'react-router-dom'
import { Loader2, Settings } from 'lucide-react'

import { FeedStack } from '@/features/feed/components/FeedStack'
import { StreakBadge } from '@/features/feed/components/StreakBadge'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { Logo } from '@/components/Logo'
import { usePreferences } from '@/lib/hooks/usePreferences'
import { useSavedFacts } from '@/lib/hooks/useSavedFacts'
import { useStats } from '@/lib/hooks/useStats'

export function FeedPage() {
  const { preferences, isLoading: preferencesLoading } = usePreferences()
  const { stats } = useStats()
  const { savedIds, toggle } = useSavedFacts()

  const domains = preferences?.domains ?? []
  const { currentFact, advance, isLoading, isEmpty } = useFeed(domains)

  if (preferencesLoading) {
    return <CenteredState />
  }

  if (!preferencesLoading && (!preferences || preferences.domains.length === 0)) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col sm:py-4">
      <header className="flex items-center justify-between px-4 py-3 sm:px-0">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 rounded-lg" />
          <h1 className="text-lg font-bold">semicolon</h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge streak={stats?.currentStreak ?? 0} />
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-muted"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>

      <main className="relative flex-1 px-0 sm:px-0">
        {isLoading && <CenteredState />}
        {!isLoading && isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <p className="font-medium text-foreground">No facts yet in your chosen domains.</p>
            <p className="text-sm">
              Try adding more domains from{' '}
              <Link to="/settings" className="underline">
                settings
              </Link>
              .
            </p>
          </div>
        )}
        {!isLoading && !isEmpty && currentFact && (
          <FeedStack
            currentFact={currentFact}
            savedIds={savedIds}
            onAdvance={advance}
            onToggleSave={toggle}
          />
        )}
      </main>
    </div>
  )
}

function CenteredState() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="animate-spin text-muted-foreground" />
    </div>
  )
}
