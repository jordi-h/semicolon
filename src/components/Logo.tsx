import { cn } from '@/lib/utils'

interface LogoProps {
  /** Sizes the icon tile (e.g. "h-7 w-7"). The wordmark in the "full"
   * variant uses its own fixed, consistent lockup size regardless. */
  className?: string
  /** 'icon' renders just the mark; 'full' adds the "semicolon" wordmark
   * next to it, for header/nav brand lockups. */
  variant?: 'icon' | 'full'
  /** Which color pairing to use — see src/assets/logo-icon(-light).svg. */
  theme?: 'dark' | 'light'
}

const THEME_COLORS = {
  dark: { tile: '#16161A', mark: '#F5F4F0' },
  light: { tile: '#F5F4F0', mark: '#16161A' },
} as const

/**
 * The semicolon app mark: a dot over a rounded bar, on a rounded-square
 * tile. Source of truth is src/assets/logo-icon.svg (dark theme) /
 * logo-icon-light.svg (light theme) — every favicon, PWA icon, and
 * native iOS/Android app icon is generated from the same shape, see
 * scripts/generate-icons.mjs and resources/*.svg.
 */
export function Logo({ className, variant = 'icon', theme = 'dark' }: LogoProps) {
  const { tile, mark } = THEME_COLORS[theme]

  const icon = (
    <svg viewBox="0 0 130 130" className={cn('h-8 w-8 shrink-0', className)} aria-hidden="true">
      <rect x="0" y="0" width="130" height="130" rx="30" fill={tile} />
      <circle cx="65" cy="48" r="8.5" fill={mark} />
      <rect x="57" y="72" width="16" height="30" rx="8" fill={mark} />
    </svg>
  )

  if (variant === 'icon') return icon

  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      <span className="font-body text-lg font-medium" style={{ color: theme === 'dark' ? mark : tile }}>
        semicolon
      </span>
    </span>
  )
}
