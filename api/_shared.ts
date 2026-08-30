/**
 * Shared helpers for the edge functions that make shared fact links
 * previewable (api/og.tsx and middleware.ts).
 *
 * These run on Vercel's edge runtime, outside the Vite app, so they
 * can't import from src/ — Vite's `@/` alias and the bundled seed data
 * don't exist here. Supabase is queried over plain REST with the anon
 * key (the same public credentials the browser already uses; `facts` and
 * `fact_translations` are public-read by design, see supabase/schema.sql).
 */

export interface PreviewFact {
  id: string
  hook: string
  fact: string
  domain: string
}

/** Mirrors DOMAIN_ACCENT in src/lib/domainTheme.ts. Duplicated rather
 * than imported because edge functions can't reach into src/ — keep the
 * two in sync when domains change. */
export const DOMAIN_ACCENT: Record<string, string> = {
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

export const INK = '#0F0B17'
export const PAPER = '#F3EFFA'

/** Vercel's edge runtime exposes env vars on `process.env` but is not
 * Node, so the full @types/node surface would be misleading here — this
 * declares only what actually exists. Both values are the same public
 * credentials the browser already ships. */
declare const process: { env: Record<string, string | undefined> }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

function restHeaders(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY ?? '',
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ''}`,
  }
}

/**
 * Loads one fact for preview, in `locale` when a translation exists and
 * falling back to the English original otherwise — the same rule the app
 * itself applies. Returns null for an unknown id or any failure, so
 * callers can degrade to a generic preview rather than erroring.
 */
export async function loadPreviewFact(
  factId: string,
  locale: string,
): Promise<PreviewFact | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  try {
    const factUrl =
      `${SUPABASE_URL}/rest/v1/facts` +
      `?id=eq.${encodeURIComponent(factId)}&select=id,hook,fact,domain&limit=1`
    const res = await fetch(factUrl, { headers: restHeaders() })
    if (!res.ok) return null

    const rows = (await res.json()) as PreviewFact[]
    const base = rows[0]
    if (!base) return null

    if (locale === 'en') return base

    const trUrl =
      `${SUPABASE_URL}/rest/v1/fact_translations` +
      `?fact_id=eq.${encodeURIComponent(factId)}` +
      `&locale=eq.${encodeURIComponent(locale)}&select=hook,fact&limit=1`
    const trRes = await fetch(trUrl, { headers: restHeaders() })
    if (!trRes.ok) return base

    const translations = (await trRes.json()) as { hook: string; fact: string }[]
    const tr = translations[0]
    return tr ? { ...base, hook: tr.hook, fact: tr.fact } : base
  } catch {
    return null
  }
}

/** Restricts a caller-supplied lang to the locales the app ships. */
export function normalizeLocale(raw: string | null): string {
  return raw && ['en', 'fr', 'nl', 'es'].includes(raw) ? raw : 'en'
}
