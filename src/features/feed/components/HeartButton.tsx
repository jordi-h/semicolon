import { Heart } from 'lucide-react'

import { CIRCLE_ICON_SIZE, CircleIconButton } from '@/components/ui/circle-icon-button'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { cn } from '@/lib/utils'

interface HeartButtonProps {
  saved: boolean
  onToggle: () => void
}

export function HeartButton({ saved, onToggle }: HeartButtonProps) {
  const { t } = useLocale()

  return (
    <CircleIconButton
      onClick={onToggle}
      active={saved}
      aria-pressed={saved}
      aria-label={saved ? t('heart.remove') : t('heart.save')}
    >
      <Heart
        size={CIRCLE_ICON_SIZE}
        className={cn(
          'transition-colors',
          saved ? 'fill-red-500 text-red-500 animate-heart-pop' : 'fill-transparent text-white',
        )}
      />
    </CircleIconButton>
  )
}
