import { describe, expect, it } from 'vitest'

import { factSearchUrl } from './factSearchUrl'

describe('factSearchUrl', () => {
  it('uses the fact sourceUrl when one is set', () => {
    const url = factSearchUrl({ hook: 'Anything', sourceUrl: 'https://example.com/article' })
    expect(url).toBe('https://example.com/article')
  })

  it('falls back to a Google search built from the hook', () => {
    const url = factSearchUrl({ hook: 'Octopus blood is blue.', sourceUrl: undefined })
    expect(url).toBe('https://www.google.com/search?q=Octopus%20blood%20is%20blue.')
  })

  it('encodes special characters in the hook safely', () => {
    const url = factSearchUrl({ hook: "It's 100% true & wild?", sourceUrl: undefined })
    expect(url.startsWith('https://www.google.com/search?q=')).toBe(true)
    expect(decodeURIComponent(url.split('q=')[1])).toBe("It's 100% true & wild?")
  })
})
