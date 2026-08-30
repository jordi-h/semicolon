/**
 * Stages content-audit work as resumable chunks, mirroring
 * scripts/translation-stage.mjs (see CLAUDE.md for why the fan-out
 * protocol looks like this).
 *
 * Writes .translation-work/in-audit-<domain>-<nn>.json holding the
 * English fields an auditor needs. Agents write
 * out-audit-<domain>-<nn>.json listing only the facts they find
 * problems with, so a clean chunk produces an empty array — the audit
 * output is far smaller than its input, unlike a translation pass.
 *
 * Usage:
 *   node scripts/audit-stage.mjs                       # every domain
 *   node scripts/audit-stage.mjs science space         # only these
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'

const CHUNK_SIZE = 40
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

  for (let i = 0; i < facts.length; i += CHUNK_SIZE) {
    const chunk = facts.slice(i, i + CHUNK_SIZE)
    const index = String(Math.floor(i / CHUNK_SIZE) + 1).padStart(2, '0')
    const path = `${WORK_DIR}/in-audit-${domain}-${index}.json`

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

console.log(`\n${staged} audit chunk(s) staged in ${WORK_DIR}/`)
