import { describe, expect, it } from 'vitest'

/**
 * useFeed's undo is deliberately a SINGLE step back — "let me see the one
 * before this", not a browsable history stack. That rule lives in two
 * lines of useFeed (setLastSkipped on advance, clear-on-use in undo), so
 * it's easy to reintroduce a stack by accident.
 *
 * These tests model that exact state machine rather than rendering the
 * hook, so they stay fast and don't need Supabase/auth. If useFeed's
 * lastSkipped handling changes, mirror it here.
 */

interface Card {
  id: string
}

/** The advance/undo state machine as implemented in useFeed. */
function createFeed(initialQueue: Card[]) {
  let queue = [...initialQueue]
  let lastSkipped: Card | null = null

  return {
    get current() {
      return queue[0] ?? null
    },
    get canUndo() {
      return lastSkipped !== null
    },
    advance() {
      const current = queue[0]
      if (!current) return
      queue = queue.slice(1)
      lastSkipped = current
    },
    undo() {
      if (!lastSkipped) return
      queue = [lastSkipped, ...queue]
      lastSkipped = null
    },
  }
}

const deck = (): Card[] => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

describe('undo goes back exactly one card', () => {
  it('cannot undo before anything has been skipped', () => {
    const feed = createFeed(deck())
    expect(feed.canUndo).toBe(false)
    feed.undo()
    expect(feed.current?.id).toBe('a')
  })

  it('restores the card that was just skipped', () => {
    const feed = createFeed(deck())
    feed.advance()
    expect(feed.current?.id).toBe('b')
    expect(feed.canUndo).toBe(true)

    feed.undo()
    expect(feed.current?.id).toBe('a')
  })

  it('a second undo in a row does nothing — no history stack', () => {
    const feed = createFeed(deck())
    feed.advance() // a -> b
    feed.advance() // b -> c
    expect(feed.current?.id).toBe('c')

    feed.undo()
    expect(feed.current?.id).toBe('b')
    expect(feed.canUndo).toBe(false)

    feed.undo()
    expect(feed.current?.id).toBe('b')
    feed.undo()
    expect(feed.current?.id).toBe('b')
  })

  it('never reaches further back than one card, however many are skipped', () => {
    const feed = createFeed(deck())
    feed.advance() // a -> b
    feed.advance() // b -> c
    feed.advance() // c -> d

    feed.undo()
    expect(feed.current?.id).toBe('c')
    // 'a' and 'b' must stay unreachable no matter how many undos follow.
    for (let i = 0; i < 5; i++) feed.undo()
    expect(feed.current?.id).toBe('c')
  })

  it('becomes undoable again after the next skip', () => {
    const feed = createFeed(deck())
    feed.advance()
    feed.undo()
    expect(feed.canUndo).toBe(false)

    feed.advance()
    expect(feed.canUndo).toBe(true)
    feed.undo()
    expect(feed.current?.id).toBe('a')
  })
})
