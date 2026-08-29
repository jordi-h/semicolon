import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { SavedFactCard } from '@/features/saved/components/SavedFactCard'
import { useSavedFacts } from '@/lib/hooks/useSavedFacts'

export function SavedPage() {
  const { savedFacts, isLoading, unsave } = useSavedFacts()

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <Link
          to="/feed"
          aria-label="Back to feed"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Saved facts</h1>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && savedFacts.length === 0 && (
        <p className="text-muted-foreground">
          Nothing saved yet — tap the heart on a card in your feed to keep it here.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {savedFacts.map(({ fact }) => (
          <SavedFactCard key={fact.id} fact={fact} onUnsave={() => unsave(fact.id)} />
        ))}
      </div>
    </div>
  )
}
