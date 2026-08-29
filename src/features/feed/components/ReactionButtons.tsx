import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { CIRCLE_ICON_SIZE, CircleIconButton } from '@/components/ui/circle-icon-button'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Reaction } from '@/lib/types'

interface ReactionButtonsProps {
  onReact: (reaction: Reaction) => void
}

export function ReactionButtons({ onReact }: ReactionButtonsProps) {
  const { t } = useLocale()

  return (
    <>
      <CircleIconButton onClick={() => onReact('more')} aria-label={t('reaction.more')}>
        <ThumbsUp size={CIRCLE_ICON_SIZE} />
      </CircleIconButton>
      <CircleIconButton onClick={() => onReact('less')} aria-label={t('reaction.less')}>
        <ThumbsDown size={CIRCLE_ICON_SIZE} />
      </CircleIconButton>
    </>
  )
}
