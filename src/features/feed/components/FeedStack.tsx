import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { ExhaustionNotice } from '@/features/feed/components/ExhaustionNotice'
import { FactCard } from '@/features/feed/components/FactCard'
import { ReactionToast } from '@/features/feed/components/ReactionToast'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Fact, Reaction } from '@/lib/types'

interface FeedStackProps {
  currentFact: Fact
  savedIds: Set<string>
  onAdvance: (reaction?: Reaction) => void
  onToggleSave: (factId: string) => void
  /** True only for a deliberately resurfaced card — see FactCard. */
  resurfaced?: boolean
  showExhaustionNotice?: boolean
  onDismissExhaustionNotice?: () => void
}

/** How much wheel/touch movement counts as an intentional swipe. */
const SWIPE_THRESHOLD_PX = 45
/** Minimum time between advances, so one gesture can't fire twice. */
const ADVANCE_COOLDOWN_MS = 350
/** How long the reaction toast stays fully visible before fading out. */
const REACTION_TOAST_VISIBLE_MS = 900
/** Total lifetime of the toast, including its fade-out transition. */
const REACTION_TOAST_TOTAL_MS = 1200

export function FeedStack({
  currentFact,
  savedIds,
  onAdvance,
  onToggleSave,
  resurfaced = false,
  showExhaustionNotice = false,
  onDismissExhaustionNotice,
}: FeedStackProps) {
  const { t } = useLocale()
  const touchStartY = useRef<number | null>(null)
  const lastAdvanceAt = useRef(0)
  const wheelAccumulator = useRef(0)
  const [reactionToast, setReactionToast] = useState<{
    reaction: Reaction
    visible: boolean
  } | null>(null)
  const toastHideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const toastClearTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(toastHideTimer.current)
      clearTimeout(toastClearTimer.current)
    }
  }, [])

  function handleReact(reaction: Reaction) {
    clearTimeout(toastHideTimer.current)
    clearTimeout(toastClearTimer.current)
    setReactionToast({ reaction, visible: true })
    toastHideTimer.current = setTimeout(
      () => setReactionToast((t) => (t ? { ...t, visible: false } : t)),
      REACTION_TOAST_VISIBLE_MS,
    )
    toastClearTimer.current = setTimeout(() => setReactionToast(null), REACTION_TOAST_TOTAL_MS)
    onAdvance(reaction)
  }

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
          onReact={handleReact}
          active
          resurfaced={resurfaced}
        />
      </div>

      {reactionToast && (
        <ReactionToast reaction={reactionToast.reaction} visible={reactionToast.visible} />
      )}

      {showExhaustionNotice && onDismissExhaustionNotice && (
        <ExhaustionNotice onDismiss={onDismissExhaustionNotice} />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-0.5 text-white/50">
        <ChevronUp size={16} className="hidden sm:block" aria-hidden="true" />
        <span className="text-xs">{t('feed.scrollHint')}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  )
}
