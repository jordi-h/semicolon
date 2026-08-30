import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Guards against user-facing text that bypasses the i18n system: plain
 * JSX text nodes and literal aria-label/placeholder/title/alt attribute
 * values, found by walking the real TypeScript AST (not a regex) so it
 * can't be fooled by text split across lines or wrapped attributes.
 *
 * This exists because of a real bug: a hardcoded string quietly shows in
 * English regardless of the selected locale, and nothing else catches
 * it — TypeScript's Record<TranslationKey, string> only guarantees the
 * *dictionaries* stay in sync with each other, not that every piece of
 * UI copy goes through t() in the first place.
 */

const SRC_ROOT = path.resolve(__dirname, '..')
const TEXT_ATTRIBUTES = new Set(['aria-label', 'placeholder', 'title', 'alt'])

/** Hardcoded text that's fine as-is — the app's own brand name, which
 * is never translated by design (see src/components/Logo.tsx). Add to
 * this list only for genuine proper nouns, never to silence a real gap. */
const ALLOWLIST = new Set(['semico'])

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .filter((entry): entry is string => typeof entry === 'string')
    .filter(
      (entry) =>
        (entry.endsWith('.tsx') || entry.endsWith('.ts')) &&
        !entry.endsWith('.test.ts') &&
        !entry.endsWith('.test.tsx'),
    )
    .map((entry) => path.join(dir, entry))
}

interface Violation {
  file: string
  line: number
  text: string
}

function scanFile(filePath: string): Violation[] {
  const source = readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const violations: Violation[] = []

  function report(node: ts.Node, text: string) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    violations.push({ file: path.relative(SRC_ROOT, filePath), line: line + 1, text })
  }

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const text = node.text.trim().replace(/\s+/g, ' ')
      if (text && /[A-Za-z]{2,}/.test(text) && !ALLOWLIST.has(text)) {
        report(node, text)
      }
    }

    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const attrName = node.name.getText(sourceFile)
      const text = node.initializer.text.trim()
      if (
        TEXT_ATTRIBUTES.has(attrName) &&
        text &&
        /[A-Za-z]{2,}/.test(text) &&
        !ALLOWLIST.has(text)
      ) {
        report(node, `${attrName}="${text}"`)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

describe('no hardcoded user-facing strings bypass the i18n system', () => {
  it('finds no literal JSX text or label/placeholder/title/alt attributes outside the allowlist', () => {
    const files = listSourceFiles(SRC_ROOT)
    const violations = files.flatMap(scanFile)

    const message = violations.map((v) => `  ${v.file}:${v.line} — "${v.text}"`).join('\n')

    expect(
      violations,
      violations.length
        ? `Found hardcoded text outside the i18n system — route it through t(), or add it to ALLOWLIST in this test if it's genuinely not translatable (e.g. a brand name):\n${message}`
        : undefined,
    ).toEqual([])
  })
})
