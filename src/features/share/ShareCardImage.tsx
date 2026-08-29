import { forwardRef } from 'react'

import { Logo } from '@/components/Logo'
import { DOMAIN_ACCENT } from '@/lib/domainTheme'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { DOMAIN_LABELS, type Fact } from '@/lib/types'

/** Pixel dimensions of the rendered share image — a 9:16 "story" ratio,
 * matching how this content actually gets reshared (Instagram/TikTok/
 * Snapchat stories) and echoing the app's own vertical card shape. */
export const SHARE_IMAGE_WIDTH = 1080
export const SHARE_IMAGE_HEIGHT = 1920

interface ShareCardImageProps {
  fact: Fact
}

/**
 * The actual graphic that gets rasterized into the shared PNG. Rendered
 * off-screen (see ShareButton) and captured with html-to-image — kept as
 * plain inline styles rather than Tailwind's gradient utilities so the
 * capture is predictable: solid background, one accent color, no clutter.
 */
export const ShareCardImage = forwardRef<HTMLDivElement, ShareCardImageProps>(
  function ShareCardImage({ fact }, ref) {
    const { locale } = useLocale()
    const accent = DOMAIN_ACCENT[fact.domain]

    return (
      <div
        ref={ref}
        style={{
          width: SHARE_IMAGE_WIDTH,
          height: SHARE_IMAGE_HEIGHT,
          background: '#0F0B17',
          fontFamily: '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif',
        }}
        className="flex flex-col justify-between p-24"
      >
        <div className="flex items-center gap-4">
          <span style={{ background: accent, width: 20, height: 20 }} className="rounded-full" />
          <span
            style={{ color: accent, fontSize: 34, letterSpacing: '0.08em' }}
            className="font-semibold uppercase"
          >
            {DOMAIN_LABELS[locale][fact.domain]}
          </span>
        </div>

        <div className="flex flex-col gap-16">
          <h1
            style={{
              fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
              fontSize: 76,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
            className="font-bold text-white"
          >
            {fact.hook}
          </h1>
          <p style={{ fontSize: 38, lineHeight: 1.5 }} className="text-white/85">
            {fact.fact}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Logo className="h-[56px] w-[56px]" />
          <span
            style={{
              fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
              fontSize: 40,
            }}
            className="font-bold text-white"
          >
            semicolon
          </span>
        </div>
      </div>
    )
  },
)
