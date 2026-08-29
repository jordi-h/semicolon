import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type PanInfo, type Variants } from 'framer-motion'
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
  onUndo: () => void
  canUndo: boolean
  onToggleSave: (factId: string) => void
  /** True only for a deliberately resurfaced card — see FactCard. */
  resurfaced?: boolean
  showExhaustionNotice?: boolean
  onDismissExhaustionNotice?: () => void
}

type Direction = 'advance' | 'undo'

/** How much wheel/drag movement counts as an intentional swipe. */
const DRAG_THRESHOLD_PX = 90
const WHEEL_THRESHOLD_PX = 45
/** A fast flick commits even if the drag distance itself was short. */
const VELOCITY_THRESHOLD = 500
/** Minimum time between advances, so one gesture can't fire twice. */
const ACTION_COOLDOWN_MS = 350
/** How long the reaction toast stays fully visible before fading out. */
const REACTION_TOAST_VISIBLE_MS = 900
/** Total lifetime of the toast, including its fade-out transition. */
const REACTION_TOAST_TOTAL_MS = 1200

const SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 } as const
const REDUCED_TRANSITION = { duration: 0.12, ease: 'linear' } as const

/** One spring, two directions: advancing exits up/enters from below;
 * undo is the exact same motion mirrored — exits down, enters from
 * above — so the direction alone communicates what happened. */
const cardVariants: Variants = {
  enter: (direction: Direction) => ({
    y: direction === 'advance' ? 56 : -56,
    opacity: 0,
    scale: 0.97,
    zIndex: 0,
  }),
  center: { y: 0, opacity: 1, scale: 1, zIndex: 1 },
  exit: (direction: Direction) => ({
    y: direction === 'advance' ? -560 : 560,
    opacity: 0,
    scale: 0.97,
    zIndex: 2,
  }),
}

const reducedVariants: Variants = {
  enter: { opacity: 0, zIndex: 0 },
  center: { opacity: 1, zIndex: 1 },
  exit: { opacity: 0, zIndex: 2 },
}

export function FeedStack({
  currentFact,
  savedIds,
  onAdvance,
  onUndo,
  canUndo,
  onToggleSave,
  resurfaced = false,
  showExhaustionNotice = false,
  onDismissExhaustionNotice,
}: FeedStackProps) {
  const { t } = useLocale()
  const prefersReducedMotion = useReducedMotion()
  const [direction, setDirection] = useState<Direction>('advance')
  const lastActionAt = useRef(0)
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

  function tryAdvance() {
    const now = Date.now()
    if (now - lastActionAt.current < ACTION_COOLDOWN_MS) return
    lastActionAt.current = now
    setDirection('advance')
    onAdvance()
  }

  function tryUndo() {
    if (!canUndo) return
    const now = Date.now()
    if (now - lastActionAt.current < ACTION_COOLDOWN_MS) return
    lastActionAt.current = now
    setDirection('undo')
    onUndo()
  }

  function handleReact(reaction: Reaction) {
    clearTimeout(toastHideTimer.current)
    clearTimeout(toastClearTimer.current)
    setReactionToast({ reaction, visible: true })
    toastHideTimer.current = setTimeout(
      () => setReactionToast((prev) => (prev ? { ...prev, visible: false } : prev)),
      REACTION_TOAST_VISIBLE_MS,
    )
    toastClearTimer.current = setTimeout(() => setReactionToast(null), REACTION_TOAST_TOTAL_MS)
    setDirection('advance')
    onAdvance(reaction)
  }

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.y < -DRAG_THRESHOLD_PX || info.velocity.y < -VELOCITY_THRESHOLD) {
      tryAdvance()
    } else if (
      canUndo &&
      (info.offset.y > DRAG_THRESHOLD_PX || info.velocity.y > VELOCITY_THRESHOLD)
    ) {
      tryUndo()
    }
    // Otherwise Framer Motion's own dragConstraints spring the card back.
  }

  function handleWheel(e: React.WheelEvent) {
    wheelAccumulator.current += e.deltaY
    if (wheelAccumulator.current > WHEEL_THRESHOLD_PX) {
      wheelAccumulator.current = 0
      tryAdvance()
    } else if (wheelAccumulator.current < -WHEEL_THRESHOLD_PX) {
      wheelAccumulator.current = 0
      tryUndo()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) {
      e.preventDefault()
      tryAdvance()
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault()
      tryUndo()
    }
  }

  const variants = prefersReducedMotion ? reducedVariants : cardVariants
  const transition = prefersReducedMotion ? REDUCED_TRANSITION : SPRING

  return (
    <div
      role="feed"
      aria-busy="false"
      tabIndex={0}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      className="relative h-full w-full overflow-hidden bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-2xl"
    >
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={currentFact.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 touch-none"
        >
          <FactCard
            fact={currentFact}
            saved={savedIds.has(currentFact.id)}
            onToggleSave={() => onToggleSave(currentFact.id)}
            onReact={handleReact}
            active
            resurfaced={resurfaced}
          />
        </motion.div>
      </AnimatePresence>

      {reactionToast && (
        <ReactionToast reaction={reactionToast.reaction} visible={reactionToast.visible} />
      )}

      {showExhaustionNotice && onDismissExhaustionNotice && (
        <ExhaustionNotice onDismiss={onDismissExhaustionNotice} />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex flex-col items-center gap-0.5 text-white/50">
        <ChevronUp size={16} className="hidden sm:block" aria-hidden="true" />
        <span className="text-label uppercase">{t('feed.scrollHint')}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  )
}
