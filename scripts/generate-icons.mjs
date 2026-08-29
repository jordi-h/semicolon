/**
 * Rasterizes public/logo*.svg into every favicon/app-icon size the app
 * references (index.html, public/manifest.json).
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Run this again after editing any of the public/logo*.svg source files.
 */
import sharp from 'sharp'

const jobs = [
  ['public/logo.svg', 'public/favicon-16.png', 16],
  ['public/logo.svg', 'public/favicon-32.png', 32],
  ['public/logo-square.svg', 'public/apple-touch-icon.png', 180],
  ['public/logo-square.svg', 'public/icons/pwa-192.png', 192],
  ['public/logo-square.svg', 'public/icons/pwa-512.png', 512],
  ['public/logo-maskable.svg', 'public/icons/pwa-maskable-192.png', 192],
  ['public/logo-maskable.svg', 'public/icons/pwa-maskable-512.png', 512],
]

for (const [src, out, size] of jobs) {
  await sharp(src).resize(size, size).png().toFile(out)
  console.log(`wrote ${out}`)
}
