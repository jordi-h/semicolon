import { useEffect, useState } from 'react'

/**
 * Tracks connectivity so the feed can say *why* it's serving a limited
 * set of facts rather than silently looking broken.
 *
 * navigator.onLine only reports whether the device has a network
 * interface, not whether Supabase is actually reachable — so treat this
 * as a hint for messaging, never as a gate on fetching. The data layer
 * still tries the network first and falls back to cache on failure
 * (see src/lib/api/facts.ts).
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
