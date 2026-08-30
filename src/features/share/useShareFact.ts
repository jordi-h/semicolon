import { useCallback, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'

import { factShareUrl } from '@/features/share/factShareUrl'
import { useLocale } from '@/lib/i18n/LocaleContext'
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
  const { locale, t } = useLocale()
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

      const filename = `semico-${fact.id}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      const shareUrl = factShareUrl(fact.id, locale)

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'semico', text: fact.hook, url: shareUrl })
        setMessage(t('share.shared'))
      } else {
        downloadBlob(blob, filename)
        try {
          await navigator.clipboard.writeText(shareUrl)
          setMessage(t('share.imageSavedLinkCopied'))
        } catch {
          setMessage(t('share.imageSaved'))
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
      setMessage(t('share.error'))
    } finally {
      setTimeout(() => setMessage(null), 2200)
    }
  }, [fact, locale, status, t])

  return { nodeRef, share, status, message }
}
