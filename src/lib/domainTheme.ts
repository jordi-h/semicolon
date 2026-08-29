import type { Domain } from '@/lib/types'

/** Tailwind gradient stops used for each domain's in-feed card background. */
export const DOMAIN_GRADIENTS: Record<Domain, string> = {
  science: 'from-emerald-600 via-teal-700 to-slate-900',
  technology: 'from-indigo-600 via-blue-700 to-slate-900',
  history: 'from-amber-700 via-orange-800 to-slate-900',
  geography: 'from-cyan-600 via-sky-700 to-slate-900',
  culture: 'from-fuchsia-600 via-pink-700 to-slate-900',
  space: 'from-violet-700 via-purple-900 to-slate-950',
  language: 'from-rose-600 via-red-700 to-slate-900',
  psychology: 'from-blue-600 via-blue-800 to-slate-900',
  art: 'from-yellow-500 via-yellow-800 to-slate-900',
  food: 'from-green-600 via-lime-700 to-slate-900',
  sports: 'from-teal-600 via-teal-800 to-slate-900',
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
  language: '#e11d48',
  psychology: '#2563eb',
  art: '#eab308',
  food: '#16a34a',
  sports: '#0d9488',
}
