/**
 * Merges finished translation chunks back into src/data/facts/*.json.
 *
 * Reads every .translation-work/out-*.json, matches records to facts by
 * **id** (never array position), and writes the translations in. Facts
 * that already have a locale keep what they have, so re-running is safe
 * and an interrupted wave costs one chunk rather than the run.
 *
 * Usage:
 *   node scripts/translation-merge.mjs           # merge
 *   node scripts/translation-merge.mjs --check   # report only, no write
 *
 * Verifies as it goes, because a subagent reporting "done, 40/40" is not
 * evidence (CLAUDE.md): unknown ids, missing locales, empty strings and
 * untranslated text identical to the English are all reported.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'

const LOCALES = ['fr', 'nl', 'es']
const FACTS_DIR = 'src/data/facts'
const WORK_DIR = '.translation-work'

const checkOnly = process.argv.includes('--check')

const outFiles = (await readdir(WORK_DIR)).filter(
  (f) => f.startsWith('out-') && f.endsWith('.json'),
)
if (outFiles.length === 0) {
  console.log(`no out-*.json in ${WORK_DIR}/ — nothing to merge`)
  process.exit(0)
}

/** id -> { fr: {...}, nl: {...}, es: {...} } */
const incoming = new Map()
const problems = []

for (const file of outFiles) {
  let records
  try {
    records = JSON.parse(await readFile(`${WORK_DIR}/${file}`, 'utf8'))
  } catch (err) {
    problems.push(`${file}: unreadable or invalid JSON (${err.message})`)
    continue
  }
  if (!Array.isArray(records)) {
    problems.push(`${file}: expected an array`)
    continue
  }

  for (const record of records) {
    if (!record?.id) {
      problems.push(`${file}: a record has no id`)
      continue
    }
    const translations = {}
    for (const locale of LOCALES) {
      const t = record.translations?.[locale]
      if (!t) {
        problems.push(`${record.id}: missing ${locale}`)
        continue
      }
      if (!t.hook?.trim() || !t.fact?.trim()) {
        problems.push(`${record.id} (${locale}): empty hook or fact`)
        continue
      }
      translations[locale] = {
        hook: t.hook,
        fact: t.fact,
        ...(t.whyItMatters ? { whyItMatters: t.whyItMatters } : {}),
      }
    }
    if (Object.keys(translations).length > 0) incoming.set(record.id, translations)
  }
}

let merged = 0
let skipped = 0
const seenIds = new Set()

for (const file of await readdir(FACTS_DIR)) {
  if (!file.endsWith('.json')) continue
  const path = `${FACTS_DIR}/${file}`
  const facts = JSON.parse(await readFile(path, 'utf8'))
  let touched = false

  for (const fact of facts) {
    const translations = incoming.get(fact.id)
    if (!translations) continue
    seenIds.add(fact.id)

    for (const [locale, value] of Object.entries(translations)) {
      if (fact.translations?.[locale]) {
        skipped++
        continue
      }
      // Identical text usually means the agent echoed the English rather
      // than translating — worth surfacing, but not worth discarding
      // (short proper-noun hooks legitimately match across locales).
      if (value.hook === fact.hook && value.fact === fact.fact) {
        problems.push(`${fact.id} (${locale}): identical to the English source`)
      }
      fact.translations = { ...fact.translations, [locale]: value }
      merged++
      touched = true
    }
  }

  if (touched && !checkOnly) {
    await writeFile(path, `${JSON.stringify(facts, null, 2)}\n`)
    console.log(`updated ${path}`)
  }
}

for (const id of incoming.keys()) {
  if (!seenIds.has(id)) problems.push(`${id}: no fact with this id`)
}

console.log(
  `\n${checkOnly ? '[check] would merge' : 'merged'} ${merged} translation(s); ` +
    `${skipped} already present`,
)
if (problems.length > 0) {
  console.log(`\n${problems.length} problem(s):`)
  for (const p of problems.slice(0, 40)) console.log(`  - ${p}`)
  if (problems.length > 40) console.log(`  ... and ${problems.length - 40} more`)
  process.exitCode = 1
}
