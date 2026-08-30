/**
 * A tiny promise-based IndexedDB key/value store, used to keep the feed
 * working without a connection.
 *
 * Why IndexedDB and not localStorage: a domain selection can resolve to
 * hundreds of facts with four locales of translated text, which blows
 * past localStorage's ~5 MB string budget and would block the main
 * thread on every read. Why hand-rolled and not a library: this needs
 * exactly get/set on one store, and the app ships this code to every
 * user — a dependency isn't worth the bytes.
 *
 * Every call is wrapped so a failure degrades to "no cache" rather than
 * breaking the feed: IndexedDB is unavailable in some private-browsing
 * modes and can throw on quota limits.
 */

const DB_NAME = 'semicolon-offline'
const DB_VERSION = 1
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).catch((err: unknown) => {
    // Don't hold on to a rejected promise — a later call may succeed.
    dbPromise = null
    throw err
  })

  dbPromise = opening
  return opening
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb()
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(key)
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Storage full or unavailable — the app works, it just won't be
    // readable offline next time.
  }
}
