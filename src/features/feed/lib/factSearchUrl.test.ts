import { describe, expect, it } from 'vitest'

import { factSearchUrl } from './factSearchUrl'

describe('factSearchUrl', () => {
  it('uses the fact sourceUrl when one is set', () => {
    const url = factSearchUrl({ hook: 'Anything', sourceUrl: 'https://example.com/article' }, 'en')
    expect(url).toBe('https://example.com/article')
  })

  it('falls back to a Google search built from the hook, localized via hl', () => {
    const url = factSearchUrl({ hook: 'Octopus blood is blue.', sourceUrl: undefined }, 'fr')
    expect(url).toBe('https://www.google.com/search?q=Octopus%20blood%20is%20blue.&hl=fr')
  })

  it('encodes special characters in the hook safely', () => {
    const url = factSearchUrl({ hook: "It's 100% true & wild?", sourceUrl: undefined }, 'en')
    expect(url.startsWith('https://www.google.com/search?q=')).toBe(true)
    const query = url.slice('https://www.google.com/search?q='.length, url.indexOf('&hl='))
    expect(decodeURIComponent(query)).toBe("It's 100% true & wild?")
  })
})
