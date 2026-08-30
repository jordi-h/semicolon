import { describe, expect, it, vi } from 'vitest'

import { factShareUrl } from './factShareUrl'

describe('factShareUrl', () => {
  it('builds a /f/:id link off the current origin', () => {
    vi.stubGlobal('location', { origin: 'https://semico.example' })
    expect(factShareUrl('science-001')).toBe('https://semico.example/f/science-001')
    vi.unstubAllGlobals()
  })
})
