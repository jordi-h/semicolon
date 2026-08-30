// Node runtime, not edge: Vercel's edge bundler rejected these functions
// ('referencing unsupported modules: @vercel') even when they imported
// nothing. Node has no such module restrictions and @vercel/og supports
// it; these are cheap, cacheable calls where the latency difference
// doesn't matter.
export const config = { runtime: 'nodejs' }

/**
 * Serves `/f/:factId` (via the rewrite in vercel.json) with real link
 * previews.
 *
 * The app is a client-rendered SPA, so its static index.html carries
 * generic meta tags — the crawlers behind WhatsApp, iMessage, Slack,
 * Discord and X don't run JavaScript, so a pasted fact link showed
 * nothing but a bare URL. Sharing is the app's main growth lever, so
 * that's worth fixing.
 *
 * This fetches the real built index.html (keeping its hashed asset
 * references correct) and injects per-fact Open Graph / Twitter tags.
 * Human visitors still receive the full SPA and hydrate normally; the
 * extra tags are inert for them.
 *
 * Deliberately self-contained: Vercel's edge bundler rejected this
 * function when it imported a shared helper from outside api/, so the
 * small amount of Supabase-reading logic is duplicated with api/og.tsx
 * rather than shared. Keep the two in sync.
 */

/** Vercel functions expose env vars on `process.env`; this declares only
 * what is used here. Both values are the
 * same public credentials the browser already ships. */
declare const process: { env: Record<string, string | undefined> }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

interface PreviewFact {
  hook: string
  fact: string
  domain: string
}

/** Loads one fact in `locale`, falling back to the English original when
 * no translation exists — the same rule the app applies. Returns null on
 * any failure so the page degrades to a generic preview. */
async function loadPreviewFact(factId: string, locale: string): Promise<PreviewFact | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/facts?id=eq.${encodeURIComponent(factId)}&select=hook,fact,domain&limit=1`,
      { headers },
    )
    if (!res.ok) return null
    const base = ((await res.json()) as PreviewFact[])[0]
    if (!base) return null
    if (locale === 'en') return base

    const trRes = await fetch(
      `${SUPABASE_URL}/rest/v1/fact_translations?fact_id=eq.${encodeURIComponent(factId)}` +
        `&locale=eq.${encodeURIComponent(locale)}&select=hook,fact&limit=1`,
      { headers },
    )
    if (!trRes.ok) return base
    const tr = ((await trRes.json()) as { hook: string; fact: string }[])[0]
    return tr ? { ...base, hook: tr.hook, fact: tr.fact } : base
  } catch {
    return null
  }
}

/** Escapes text for use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)

  const shell = await fetch(new URL('/index.html', url.origin))
  if (!shell.ok) return new Response('Not found', { status: 404 })
  const html = await shell.text()

  const respond = (body: string) =>
    new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // The fact is immutable, but the shell's hashed asset names
        // change every deploy — so cache briefly at the edge only.
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    })

  const factId = url.searchParams.get('id')
  if (!factId) return respond(html)

  const rawLang = url.searchParams.get('lang')
  const locale = rawLang && ['en', 'fr', 'nl', 'es'].includes(rawLang) ? rawLang : 'en'

  const fact = await loadPreviewFact(factId, locale)
  if (!fact) return respond(html)

  const pageUrl = `${url.origin}/f/${encodeURIComponent(factId)}`
  const imageUrl = `${url.origin}/api/og?id=${encodeURIComponent(factId)}&lang=${encodeURIComponent(locale)}`

  const tags = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="semicolon" />`,
    `<meta property="og:title" content="${escapeAttr(fact.hook)}" />`,
    `<meta property="og:description" content="${escapeAttr(fact.fact)}" />`,
    `<meta property="og:url" content="${escapeAttr(pageUrl)}" />`,
    `<meta property="og:image" content="${escapeAttr(imageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(fact.hook)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(fact.fact)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(imageUrl)}" />`,
    `<title>${escapeAttr(fact.hook)}</title>`,
  ].join('\n    ')

  // Drop the shell's generic <title> so the fact-specific one is the
  // only candidate a crawler sees.
  const withoutStaticTitle = html.replace(/<title>[\s\S]*?<\/title>/, '')
  return respond(withoutStaticTitle.replace('</head>', `    ${tags}\n  </head>`))
}
