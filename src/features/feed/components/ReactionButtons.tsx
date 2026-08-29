import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Reaction } from '@/lib/types'

interface ReactionButtonsProps {
  onReact: (reaction: Reaction) => void
}

export function ReactionButtons({ onReact }: ReactionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onReact('more')}
        aria-label="More like this"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform active:scale-90 hover:bg-black/55',
        )}
      >
        <ThumbsUp size={20} />
      </button>
      <button
        type="button"
        onClick={() => onReact('less')}
        aria-label="Less like this"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform active:scale-90 hover:bg-black/55',
        )}
      >
        <ThumbsDown size={20} />
      </button>
    </div>
  )
}
