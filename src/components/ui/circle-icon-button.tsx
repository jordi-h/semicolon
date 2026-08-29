import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export interface CircleIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visually highlights the button, e.g. once a saved/toggled state is on. */
  active?: boolean
}

/**
 * The one canonical circular icon button used for every card action
 * (save, react, share). Centralizing size/style here — rather than each
 * button picking its own — is what keeps them from drifting out of sync
 * with each other.
 */
export const CircleIconButton = forwardRef<HTMLButtonElement, CircleIconButtonProps>(
  function CircleIconButton({ active, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-md backdrop-blur-md transition-all duration-150 hover:bg-white/20 active:scale-90 disabled:pointer-events-none disabled:opacity-50',
          active && 'bg-white/20',
          className,
        )}
        {...props}
      />
    )
  },
)

/** Icon size that reads correctly inside CircleIconButton's 48px circle. */
export const CIRCLE_ICON_SIZE = 22
