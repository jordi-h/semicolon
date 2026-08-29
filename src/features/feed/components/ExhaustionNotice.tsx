import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

import { useLocale } from '@/lib/i18n/LocaleContext'

/** One-time, subtle notice shown the first time a user exhausts every
 * fact in their selected domains and the feed switches to serving older
 * content least-recently-seen-first. Auto-dismisses itself. */
export function ExhaustionNotice({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useLocale()

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-4 top-6 z-20 flex animate-in fade-in slide-in-from-top-2 items-start gap-2 rounded-xl border border-white/10 bg-card/90 px-4 py-3 text-body-sm text-foreground shadow-lg backdrop-blur-md"
    >
      <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
      <span>{t('exhaustion.notice')}</span>
    </div>
  )
}
