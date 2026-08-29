import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

/** One-time, subtle notice shown the first time a user exhausts every
 * fact in their selected domains and the feed switches to serving older
 * content least-recently-seen-first. Auto-dismisses itself. */
export function ExhaustionNotice({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-4 top-6 z-20 flex animate-in fade-in slide-in-from-top-2 items-start gap-2 rounded-xl bg-black/70 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm"
    >
      <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
      <span>
        You've seen everything in your topics — here's older content, or add more domains in
        settings.
      </span>
    </div>
  )
}
