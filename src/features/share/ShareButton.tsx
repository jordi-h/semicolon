import { Loader2, Share2 } from 'lucide-react'

import { CIRCLE_ICON_SIZE, CircleIconButton } from '@/components/ui/circle-icon-button'
import { ShareCardImage } from '@/features/share/ShareCardImage'
import { useShareFact } from '@/features/share/useShareFact'
import type { Fact } from '@/lib/types'

interface ShareButtonProps {
  fact: Fact
}

/** Share action for a single fact card. Fully self-contained: renders its
 * own off-screen capture target and confirmation toast, so dropping this
 * into a card only ever adds one line. */
export function ShareButton({ fact }: ShareButtonProps) {
  const { nodeRef, share, status, message } = useShareFact(fact)

  return (
    <div className="relative">
      <CircleIconButton
        onClick={share}
        disabled={status === 'generating'}
        aria-label="Share this fact"
      >
        {status === 'generating' ? (
          <Loader2 size={CIRCLE_ICON_SIZE} className="animate-spin" />
        ) : (
          <Share2 size={CIRCLE_ICON_SIZE} />
        )}
      </CircleIconButton>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[12rem] animate-in fade-in slide-in-from-bottom-1 rounded-lg bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          {message}
        </div>
      )}

      {/* Off-screen capture target for html-to-image — never visible to the user. */}
      <div aria-hidden="true" className="pointer-events-none fixed left-[-9999px] top-0">
        <ShareCardImage ref={nodeRef} fact={fact} />
      </div>
    </div>
  )
}
