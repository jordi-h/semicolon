/**
 * Loads every fact in src/data/facts/*.json into Supabase.
 *
 * Usage:
 *   npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL in .env.local —
 * the service role key bypasses row-level security, which is needed since
 * `facts` is otherwise read-only from the client. Never expose that key
 * to the browser; this script only ever runs on your machine.
 *
 * Safe to re-run: rows are upserted by id, so editing a fact's text in the
 * JSON and re-running just updates that row.
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

import { allFacts } from '../src/data/facts'

config({ path: '.env.local' })

// Node 20 has no built-in WebSocket global (added in Node 22), which
// @supabase/supabase-js needs even though this script never uses realtime.
if (!globalThis.WebSocket) {
  // @ts-expect-error -- `ws` is a close-enough polyfill for this purpose.
  globalThis.WebSocket = WebSocket
}

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local — see .env.example.',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

async function upsertInBatches(
  table: string,
  rows: Record<string, unknown>[],
  batchSize = 100,
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).upsert(batch)
    if (error) {
      console.error(`Failed upserting ${table} at batch starting index ${i}:`, error.message)
      process.exit(1)
    }
    console.log(`  ${table}: upserted ${Math.min(i + batchSize, rows.length)}/${rows.length}`)
  }
}

async function seed() {
  console.log(`Seeding ${allFacts.length} facts…`)

  const rows = allFacts.map((fact) => ({
    id: fact.id,
    domain: fact.domain,
    hook: fact.hook,
    fact: fact.fact,
    why_it_matters: fact.whyItMatters ?? null,
    tags: fact.tags,
    source_url: fact.sourceUrl ?? null,
  }))
  await upsertInBatches('facts', rows)

  const translationRows = allFacts.flatMap((fact) =>
    Object.entries(fact.translations ?? {}).map(([locale, translation]) => ({
      fact_id: fact.id,
      locale,
      hook: translation.hook,
      fact: translation.fact,
      why_it_matters: translation.whyItMatters ?? null,
    })),
  )
  console.log(`Seeding ${translationRows.length} fact translations…`)
  await upsertInBatches('fact_translations', translationRows)

  console.log('Done.')
}

seed()
