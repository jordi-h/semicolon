/**
 * Stages translation work as resumable id-keyed chunks — the fan-out
 * protocol in CLAUDE.md, made executable so the next bulk run doesn't
 * re-improvise it.
 *
 * Writes .translation-work/in-<domain>-<nn>.json, each holding at most
 * CHUNK_SIZE facts that are still missing at least one target locale.
 * Facts already fully translated are skipped, so re-running after an
 * interrupted wave stages only what's actually left.
 *
 * Usage:
 *   node scripts/translation-stage.mjs                  # every domain
 *   node scripts/translation-stage.mjs art food sports  # only these
 *
 * Then hand each in-*.json to one subagent, and merge the out-*.json it
 * writes with scripts/translation-merge.mjs.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'

/** Deliberately small. A batch that dies before writing produces
 * nothing, so an oversized batch is not a faster batch, it is a riskier
 * one — see CLAUDE.md for how this number was arrived at. */
const CHUNK_SIZE = 40
const LOCALES = ['fr', 'nl', 'es']
const FACTS_DIR = 'src/data/facts'
const WORK_DIR = '.translation-work'

const only = process.argv.slice(2)

await mkdir(WORK_DIR, { recursive: true })

const files = (await readdir(FACTS_DIR))
  .filter((f) => f.endsWith('.json'))
  .filter((f) => only.length === 0 || only.includes(f.replace(/\.json$/, '')))

let staged = 0
for (const file of files) {
  const domain = file.replace(/\.json$/, '')
  const facts = JSON.parse(await readFile(`${FACTS_DIR}/${file}`, 'utf8'))

  const pending = facts.filter((f) => LOCALES.some((l) => !f.translations?.[l]))
  if (pending.length === 0) {
    console.log(`${domain}: complete, nothing to stage`)
    continue
  }

  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE)
    const index = String(Math.floor(i / CHUNK_SIZE) + 1).padStart(2, '0')
    const path = `${WORK_DIR}/in-${domain}-${index}.json`

    // Only the translatable fields travel — domain/tags/sourceUrl are
    // not translated and would just cost tokens in both directions.
    await writeFile(
      path,
      JSON.stringify(
        chunk.map((f) => ({
          id: f.id,
          hook: f.hook,
          fact: f.fact,
          ...(f.whyItMatters ? { whyItMatters: f.whyItMatters } : {}),
        })),
        null,
        2,
      ),
    )
    console.log(`wrote ${path} (${chunk.length} facts)`)
    staged++
  }
}

console.log(`\n${staged} chunk(s) staged in ${WORK_DIR}/`)
