import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Reaction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ReactionToastProps {
  reaction: Reaction
  visible: boolean
}

/** Brief acknowledgment shown when the user taps 👍/👎, since that action
 * has no other visible effect — it only quietly reweights the feed. */
export function ReactionToast({ reaction, visible }: ReactionToastProps) {
  const { t } = useLocale()
  const isMore = reaction === 'more'

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
      )}
    >
      <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
        {isMore ? (
          <ThumbsUp size={16} className="text-emerald-400" />
        ) : (
          <ThumbsDown size={16} className="text-rose-400" />
        )}
        {isMore ? t('reaction.toastMore') : t('reaction.toastLess')}
      </div>
    </div>
  )
}
