import { useSyncExternalStore } from 'react'

/*
  Counts where this tab's responses came from, so you can watch the cache
  and ETags at work (shown in the API access dialog):
    cached       – fresh in sessionStorage, no request sent at all
    notModified  – stale in the cache, GitHub answered 304 Not Modified
    downloaded   – a full 200 response with a body
*/
let stats = { cached: 0, notModified: 0, downloaded: 0 }
const listeners = new Set()

export function countResponse(kind) {
  stats = { ...stats, [kind]: stats[kind] + 1 } // new object so React sees the change
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useRequestStats = () => useSyncExternalStore(subscribe, () => stats)
