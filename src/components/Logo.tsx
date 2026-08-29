import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  /** Renders just the white semicolon mark with no background, for use on a colored surface. */
  markOnly?: boolean
}

/** The semicolon app mark. See public/logo*.svg for the source used to generate favicons/app icons. */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <svg viewBox="0 0 512 512" className={cn('h-8 w-8', className)} aria-hidden="true">
      {!markOnly && (
        <>
          <defs>
            <linearGradient id="semicolon-logo-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="55%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="112" fill="url(#semicolon-logo-bg)" />
        </>
      )}
      <circle cx="256" cy="196" r="54" fill={markOnly ? 'currentColor' : '#ffffff'} />
      <path
        d="M 210 306
           a 54 54 0 1 1 76 46
           q -4 46 -70 92
           q -20 12 -30 4
           q -8 -8 4 -22
           q 44 -40 46 -78
           a 54 54 0 0 1 -26 -42 Z"
        fill={markOnly ? 'currentColor' : '#ffffff'}
      />
    </svg>
  )
}
