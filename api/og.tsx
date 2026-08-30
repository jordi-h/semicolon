import { ImageResponse } from '@vercel/og'

import { DOMAIN_ACCENT, INK, PAPER, loadPreviewFact, normalizeLocale } from './_shared'

export const config = { runtime: 'edge' }

const WIDTH = 1200
const HEIGHT = 630

/**
 * Fetches Bricolage Grotesque (the app's display face) as a TTF, which
 * is what satori needs — the modern woff2 Google Fonts serves by default
 * can't be parsed. Requesting with an old User-Agent gets the TTF URL.
 *
 * Returns null on any failure so the image still renders in the default
 * font: a slightly off-brand preview is much better than a broken one.
 */
async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700',
      { headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' } },
    )
    if (!cssRes.ok) return null
    const css = await cssRes.text()
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1]
    if (!url) return null
    const fontRes = await fetch(url)
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

/** Keeps the hook from overflowing the card on unusually long facts. */
function clamp(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…'
}

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url)
  const factId = searchParams.get('id')
  const locale = normalizeLocale(searchParams.get('lang'))

  const [fact, font] = await Promise.all([
    factId ? loadPreviewFact(factId, locale) : Promise.resolve(null),
    loadDisplayFont(),
  ])

  const accent = fact ? (DOMAIN_ACCENT[fact.domain] ?? PAPER) : PAPER
  const hook = fact ? clamp(fact.hook, 160) : 'semicolon'
  const body = fact
    ? clamp(fact.fact, 200)
    : 'Bite-sized knowledge, one card at a time.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          // A wash of the domain's accent over Ink, echoing the in-app card.
          backgroundColor: INK,
          backgroundImage: `linear-gradient(135deg, ${accent}33 0%, ${INK} 60%)`,
          fontFamily: font ? 'Bricolage' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: accent,
              display: 'flex',
            }}
          />
          <div
            style={{
              color: accent,
              fontSize: 26,
              letterSpacing: 3,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {fact?.domain ?? 'semicolon'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              color: PAPER,
              fontSize: hook.length > 90 ? 54 : 68,
              lineHeight: 1.15,
              letterSpacing: -1,
              display: 'flex',
            }}
          >
            {hook}
          </div>
          <div
            style={{
              color: `${PAPER}B0`,
              fontSize: 28,
              lineHeight: 1.45,
              display: 'flex',
            }}
          >
            {body}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* The semicolon mark: dot over a rounded bar on its tile. */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              backgroundColor: '#16161A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 10,
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: '#F5F4F0',
                display: 'flex',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 23,
                width: 7,
                height: 12,
                borderRadius: 4,
                backgroundColor: '#F5F4F0',
                display: 'flex',
              }}
            />
          </div>
          <div style={{ color: PAPER, fontSize: 30, display: 'flex' }}>semicolon</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: font ? [{ name: 'Bricolage', data: font, weight: 700, style: 'normal' }] : undefined,
      headers: {
        // Facts are immutable content; let crawlers and CDNs keep these.
        'cache-control': 'public, immutable, no-transform, max-age=31536000',
      },
    },
  )
}
