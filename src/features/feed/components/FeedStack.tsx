import { useRef } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { FactCard } from '@/features/feed/components/FactCard'
import type { Fact, Reaction } from '@/lib/types'

interface FeedStackProps {
  currentFact: Fact
  savedIds: Set<string>
  onAdvance: (reaction?: Reaction) => void
  onToggleSave: (factId: string) => void
}

/** How much wheel/touch movement counts as an intentional swipe. */
const SWIPE_THRESHOLD_PX = 45
/** Minimum time between advances, so one gesture can't fire twice. */
const ADVANCE_COOLDOWN_MS = 350

export function FeedStack({ currentFact, savedIds, onAdvance, onToggleSave }: FeedStackProps) {
  const touchStartY = useRef<number | null>(null)
  const lastAdvanceAt = useRef(0)
  const wheelAccumulator = useRef(0)

  function tryAdvance() {
    const now = Date.now()
    if (now - lastAdvanceAt.current < ADVANCE_COOLDOWN_MS) return
    lastAdvanceAt.current = now
    onAdvance()
  }

  function handleWheel(e: React.WheelEvent) {
    wheelAccumulator.current += e.deltaY
    if (wheelAccumulator.current > SWIPE_THRESHOLD_PX) {
      wheelAccumulator.current = 0
      tryAdvance()
    } else if (wheelAccumulator.current < 0) {
      wheelAccumulator.current = 0
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current
    const deltaY = touchStartY.current - endY
    touchStartY.current = null
    if (deltaY > SWIPE_THRESHOLD_PX) tryAdvance()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) {
      e.preventDefault()
      tryAdvance()
    }
  }

  return (
    <div
      role="feed"
      aria-busy="false"
      tabIndex={0}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      className="relative h-full w-full overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:rounded-2xl"
    >
      <div
        key={currentFact.id}
        className="h-full w-full animate-in fade-in slide-in-from-bottom-8 duration-300"
      >
        <FactCard
          fact={currentFact}
          saved={savedIds.has(currentFact.id)}
          onToggleSave={() => onToggleSave(currentFact.id)}
          onReact={(reaction) => onAdvance(reaction)}
          active
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-0.5 text-white/50">
        <ChevronUp size={16} className="hidden sm:block" aria-hidden="true" />
        <span className="text-xs">Scroll, swipe up, or press ↓ for the next fact</span>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  )
}
