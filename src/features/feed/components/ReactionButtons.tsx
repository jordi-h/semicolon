import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { CIRCLE_ICON_SIZE, CircleIconButton } from '@/components/ui/circle-icon-button'
import type { Reaction } from '@/lib/types'

interface ReactionButtonsProps {
  onReact: (reaction: Reaction) => void
}

export function ReactionButtons({ onReact }: ReactionButtonsProps) {
  return (
    <>
      <CircleIconButton onClick={() => onReact('more')} aria-label="More like this">
        <ThumbsUp size={CIRCLE_ICON_SIZE} />
      </CircleIconButton>
      <CircleIconButton onClick={() => onReact('less')} aria-label="Less like this">
        <ThumbsDown size={CIRCLE_ICON_SIZE} />
      </CircleIconButton>
    </>
  )
}
