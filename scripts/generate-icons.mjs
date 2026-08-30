/**
 * Rasterizes src/assets/logo-icon.svg (the app's single source-of-truth
 * mark) into every web/PWA favicon and icon size the app references
 * (index.html, the PWA manifest in vite.config.ts).
 *
 * Native iOS/Android icons + splash screens are handled separately by
 * @capacitor/assets, reading resources/icon-only.svg,
 * resources/icon-(foreground|background).svg, and resources/splash.svg
 * — all four are hand-scaled copies of the same mark. Run both together
 * with `npm run generate:icons`.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Run this again after editing src/assets/logo-icon.svg (and update the
 * resources/*.svg copies to match — see README).
 */
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import toIco from 'to-ico'

const SOURCE = 'src/assets/logo-icon.svg'
/** Glyph-only, transparent-background render of the mark, already
 * centered within a safe zone that survives circular/squircle masking
 * (see resources/icon-foreground.svg) — reused here so the PWA's
 * maskable icons and Android's adaptive icons stay pixel-consistent. */
const MASKABLE_FOREGROUND = 'resources/icon-foreground.svg'
const TILE_BACKGROUND = '#16161A'

await mkdir('public/icons', { recursive: true })

const flatSizes = [
  ['public/favicon-16.png', 16],
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
  ['public/icons/pwa-192.png', 192],
  ['public/icons/pwa-512.png', 512],
]

for (const [out, size] of flatSizes) {
  await sharp(SOURCE).resize(size, size).png().toFile(out)
  console.log(`wrote ${out}`)
}

// Maskable icons: a full-bleed solid-color background (no pre-baked
// rounding — the OS applies its own mask shape) with the glyph
// composited on top, already safely inset.
for (const size of [192, 512]) {
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: TILE_BACKGROUND,
    },
  })
    .png()
    .toBuffer()
  const foreground = await sharp(MASKABLE_FOREGROUND).resize(size, size).png().toBuffer()

  const out = `public/icons/pwa-maskable-${size}.png`
  await sharp(background).composite([{ input: foreground }]).png().toFile(out)
  console.log(`wrote ${out}`)
}

// The link-preview image used for shared fact pages (see
// api/fact-page.ts). 1200x630 is the standard Open Graph size.
await sharp('resources/og-default.svg').resize(1200, 630).png().toFile('public/og-default.png')
console.log('wrote public/og-default.png')

// favicon.ico: a multi-resolution ICO built from the same source.
const icoSizes = [16, 32, 48]
const icoBuffers = await Promise.all(
  icoSizes.map((size) => sharp(SOURCE).resize(size, size).png().toBuffer()),
)
const icoBuffer = await toIco(icoBuffers)
await writeFile('public/favicon.ico', icoBuffer)
console.log('wrote public/favicon.ico')

// Keep the SVG favicon link (index.html) byte-for-byte in sync with the
// canonical source.
await copyFile(SOURCE, 'public/logo.svg')
console.log('wrote public/logo.svg')
