import { loadPreviewFact, normalizeLocale } from './api/_shared'

/**
 * Gives shared fact links (`/f/:factId`) real link previews.
 *
 * The app is a client-rendered SPA, so its static index.html carries
 * generic meta tags — crawlers for WhatsApp, iMessage, Slack, Discord
 * and X don't run JavaScript, so a pasted link showed nothing but a bare
 * URL. Sharing is the app's main growth lever, so that's worth fixing.
 *
 * This runs only on /f/* (see config.matcher), fetches the real built
 * index.html, and injects per-fact Open Graph / Twitter tags before
 * </head>. Human visitors still receive the full SPA and hydrate
 * normally — the extra tags are inert for them.
 */
export const config = { matcher: '/f/:path*' }

/** Escapes text for use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const shell = await fetch(new URL('/index.html', url))

  // If the shell itself is unavailable there's nothing to enhance.
  if (!shell.ok) return shell

  const html = await shell.text()
  const htmlResponse = (body: string) =>
    new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Short shared cache: the fact is immutable but the shell's
        // hashed asset names change on every deploy.
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    })

  const factId = url.pathname.split('/')[2]
  if (!factId) return htmlResponse(html)

  const locale = normalizeLocale(url.searchParams.get('lang'))
  const fact = await loadPreviewFact(factId, locale)
  if (!fact) return htmlResponse(html)

  const pageUrl = `${url.origin}/f/${encodeURIComponent(factId)}`
  const imageUrl =
    `${url.origin}/api/og?id=${encodeURIComponent(factId)}&lang=${encodeURIComponent(locale)}`

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
    // The generic <title>/description from index.html would otherwise win
    // for crawlers that read them; give them the fact instead.
    `<title>${escapeAttr(fact.hook)}</title>`,
  ].join('\n    ')

  // Drop the shell's generic title so the fact-specific one is unambiguous.
  const withoutStaticTitle = html.replace(/<title>[\s\S]*?<\/title>/, '')
  return htmlResponse(withoutStaticTitle.replace('</head>', `    ${tags}\n  </head>`))
}
