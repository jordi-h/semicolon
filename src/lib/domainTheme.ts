import type { Domain } from '@/lib/types'

/** Tailwind gradient stops used for each domain's in-feed card background. */
export const DOMAIN_GRADIENTS: Record<Domain, string> = {
  science: 'from-emerald-600 via-teal-700 to-slate-900',
  technology: 'from-indigo-600 via-blue-700 to-slate-900',
  history: 'from-amber-700 via-orange-800 to-slate-900',
  geography: 'from-cyan-600 via-sky-700 to-slate-900',
  culture: 'from-fuchsia-600 via-pink-700 to-slate-900',
  space: 'from-violet-700 via-purple-900 to-slate-950',
}

/** Solid accent color per domain — used anywhere a single flat color reads
 * better than a gradient (share images, badges). */
export const DOMAIN_ACCENT: Record<Domain, string> = {
  science: '#10b981',
  technology: '#6366f1',
  history: '#f97316',
  geography: '#0ea5e9',
  culture: '#ec4899',
  space: '#8b5cf6',
}
