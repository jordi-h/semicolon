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
      className="relative overflow-visible"
    >
      {saved && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-10px] animate-heart-glow rounded-full bg-ember"
        />
      )}
      <Heart
        size={CIRCLE_ICON_SIZE}
        className={cn(
          'relative transition-colors',
          saved ? 'animate-heart-pop fill-ember text-ember' : 'fill-transparent text-white',
        )}
      />
    </CircleIconButton>
  )
}
