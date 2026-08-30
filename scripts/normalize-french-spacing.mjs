/**
 * Normalizes French typographic spacing in src/data/facts/*.json.
 *
 * French puts a space before the "double" punctuation marks ; : ! ? and
 * inside guillemets — and that space must be non-breaking, or the line
 * can wrap leaving a lone « ? » at the start of the next line. Card
 * hooks are short and wrap constantly, so this is visible, not pedantic.
 *
 * Translation agents were inconsistent about this (some emitted a real
 * U+00A0, most emitted a plain space), which is exactly the kind of
 * mechanical rule that should be applied by a script rather than asked
 * of a language model twenty-five times.
 *
 * Uses U+00A0 (NO-BREAK SPACE) rather than the typographically stricter
 * U+202F (NARROW NO-BREAK SPACE): both prevent the bad wrap, but U+00A0
 * is present in every font the app might fall back to, and a missing
 * glyph box would be a worse regression than a slightly wide space.
 *
 * Only converts a space that is already there. It never inserts one
 * where the author wrote none, because "10:30", "http://" and similar
 * legitimately take no space and this script cannot tell them apart.
 *
 * French only — Dutch and Spanish do not use this convention.
 *
 * Usage:
 *   node scripts/normalize-french-spacing.mjs           # rewrite
 *   node scripts/normalize-french-spacing.mjs --check   # report only
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'

const FACTS_DIR = 'src/data/facts'
const NBSP = ' '
const checkOnly = process.argv.includes('--check')

/** A plain or narrow space before ; : ! ? or a closing guillemet, and a
 * plain space after an opening one. */
const BEFORE = /[  ]+([;:!?»])/g
const AFTER = /(«)[  ]+/g

function normalize(value) {
  return value.replace(BEFORE, `${NBSP}$1`).replace(AFTER, `$1${NBSP}`)
}

let changed = 0
let filesTouched = 0

for (const file of await readdir(FACTS_DIR)) {
  if (!file.endsWith('.json')) continue
  const path = `${FACTS_DIR}/${file}`
  const facts = JSON.parse(await readFile(path, 'utf8'))
  let touched = false

  for (const fact of facts) {
    const fr = fact.translations?.fr
    if (!fr) continue
    for (const field of ['hook', 'fact', 'whyItMatters']) {
      if (typeof fr[field] !== 'string') continue
      const next = normalize(fr[field])
      if (next !== fr[field]) {
        fr[field] = next
        changed++
        touched = true
      }
    }
  }

  if (touched) {
    filesTouched++
    if (!checkOnly) {
      await writeFile(path, `${JSON.stringify(facts, null, 2)}\n`)
      console.log(`updated ${path}`)
    }
  }
}

console.log(
  `${checkOnly ? '[check] would fix' : 'fixed'} ${changed} field(s) across ${filesTouched} file(s)`,
)
