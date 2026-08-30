/** Small typed wrapper around localStorage, used only by the local-dev
 * fallback data layer in src/lib/api (active when Supabase isn't configured). */

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can throw in private-browsing/full-storage situations;
    // the app still works, it just won't persist across reloads.
  }
}

export function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Same private-browsing/quota caveat as writeLocal.
  }
}

const GUEST_ID_KEY = 'semico:guest-id'

/** Stable per-browser id used to namespace local data when no one is
 * signed in via Supabase (i.e. Supabase isn't configured yet). */
export function getGuestId(): string {
  let id = window.localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}
