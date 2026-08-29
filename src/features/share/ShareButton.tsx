import { Loader2, Share2 } from 'lucide-react'

import { ShareCardImage } from '@/features/share/ShareCardImage'
import { useShareFact } from '@/features/share/useShareFact'
import type { Fact } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  fact: Fact
  size?: 'default' | 'lg'
}

/** Share action for a single fact card. Fully self-contained: renders its
 * own off-screen capture target and confirmation toast, so dropping this
 * into a card only ever adds one line. */
export function ShareButton({ fact, size = 'default' }: ShareButtonProps) {
  const { nodeRef, share, status, message } = useShareFact(fact)
  const dimension = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
  const iconSize = size === 'lg' ? 26 : 20

  return (
    <div className="relative">
      <button
        type="button"
        onClick={share}
        disabled={status === 'generating'}
        aria-label="Share this fact"
        className={cn(
          dimension,
          'flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform active:scale-90 hover:bg-black/55 disabled:opacity-60',
        )}
      >
        {status === 'generating' ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          <Share2 size={iconSize} />
        )}
      </button>

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
