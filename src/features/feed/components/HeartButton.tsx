import { Heart } from 'lucide-react'

import { cn } from '@/lib/utils'

interface HeartButtonProps {
  saved: boolean
  onToggle: () => void
  size?: 'default' | 'lg'
}

export function HeartButton({ saved, onToggle, size = 'default' }: HeartButtonProps) {
  const dimension = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
  const iconSize = size === 'lg' ? 28 : 22

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved facts' : 'Save this fact'}
      className={cn(
        dimension,
        'flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform active:scale-90 hover:bg-black/55',
      )}
    >
      <Heart
        size={iconSize}
        className={cn(
          'transition-colors',
          saved ? 'fill-red-500 text-red-500 animate-heart-pop' : 'fill-transparent text-white',
        )}
      />
    </button>
  )
}
