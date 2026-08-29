import { useCallback, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'

import { factShareUrl } from '@/features/share/factShareUrl'
import type { Fact } from '@/lib/types'

export type ShareStatus = 'idle' | 'generating' | 'error'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function useShareFact(fact: Fact) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const share = useCallback(async () => {
    if (status === 'generating') return
    setStatus('generating')
    setMessage(null)

    try {
      const node = nodeRef.current
      if (!node) throw new Error('Share card is not mounted yet')

      const blob = await toBlob(node, { pixelRatio: 2 })
      if (!blob) throw new Error('Failed to render the share image')

      const filename = `semicolon-${fact.id}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      const shareUrl = factShareUrl(fact.id)

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'semicolon', text: fact.hook, url: shareUrl })
        setMessage('Shared!')
      } else {
        downloadBlob(blob, filename)
        try {
          await navigator.clipboard.writeText(shareUrl)
          setMessage('Image saved & link copied!')
        } catch {
          setMessage('Image saved!')
        }
      }
      setStatus('idle')
    } catch (err) {
      // The user closing the native share sheet isn't a real failure.
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle')
        return
      }
      setStatus('error')
      setMessage('Could not share — try again')
    } finally {
      setTimeout(() => setMessage(null), 2200)
    }
  }, [fact, status])

  return { nodeRef, share, status, message }
}
