import type { Domain } from '@/lib/types'

/** Matches --background in src/index.css (Ink). Duplicated here because
 * this file produces plain CSS strings for inline styles, outside
 * Tailwind's class system. */
const INK = '#0F0B17'

/**
 * One accent hue per domain, all drawn from the same 75% saturation /
 * 62% lightness formula so the eleven read as a matched set rather than
 * stock Tailwind colors — and all kept clear of the UI's own Signal
 * Violet (~260°) and Ember (~14°), which stay reserved for chrome, never
 * content, so a domain accent is never mistaken for an action.
 */
export const DOMAIN_ACCENT: Record<Domain, string> = {
  history: '#E7B655',
  sports: '#D3E755',
  food: '#90E755',
  science: '#55E75D',
  geography: '#55E7A1',
  technology: '#55E7E4',
  psychology: '#55A5E7',
  space: '#5561E7',
  art: '#CF55E7',
  culture: '#E755BB',
  language: '#E7557A',
}

/** Full-bleed card background for a domain: its accent, darkening into
 * Ink via color-mix() rather than a hand-picked second gradient stop —
 * every domain fades to black the exact same way. */
export function domainGradient(domain: Domain): string {
  const accent = DOMAIN_ACCENT[domain]
  return `linear-gradient(165deg, ${accent} 0%, color-mix(in srgb, ${accent} 45%, ${INK}) 55%, ${INK} 100%)`
}

/** A domain's accent at low opacity, for tinting badges/pills so they
 * read as "this domain's own chrome" instead of generic white-on-glass. */
export function domainTint(domain: Domain, alpha: number): string {
  return `color-mix(in srgb, ${DOMAIN_ACCENT[domain]} ${Math.round(alpha * 100)}%, transparent)`
}
