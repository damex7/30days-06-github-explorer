import { useSyncExternalStore } from 'react'

/*
  The latest rate-limit numbers GitHub sent us, kept outside React so that
  request() (plain JS) can write them and any component can read them.

  GitHub keeps separate "buckets" (resources). The two we use:
    core    – users, repos, READMEs: 60/hour without a token, 5,000 with one
    search  – /search/*: 10/minute without a token, 30 with one
  Every response says which bucket it came from in x-ratelimit-resource.

  useSyncExternalStore is React's official way to subscribe a component to
  a store like this: it re-renders whenever we call emit().
*/

const limits = {} // { core: { limit, remaining, used, reset }, search: {...} }
const listeners = new Set()

function emit() {
  for (const listener of listeners) listener()
}

/** Read the x-ratelimit-* headers from any response. */
export function recordRateLimit(headers) {
  const remaining = headers.get('x-ratelimit-remaining')
  if (remaining === null) return
  const resource = headers.get('x-ratelimit-resource') || 'core'
  limits[resource] = {
    limit: Number(headers.get('x-ratelimit-limit')),
    remaining: Number(remaining),
    used: Number(headers.get('x-ratelimit-used')),
    reset: Number(headers.get('x-ratelimit-reset')) * 1000, // header is in seconds since 1970
  }
  emit()
}

/** Fill every bucket at once from GET /rate_limit's body. */
export function recordRateLimitBody(body) {
  for (const [resource, info] of Object.entries(body?.resources ?? {})) {
    limits[resource] = { ...info, reset: info.reset * 1000 }
  }
  emit()
}

export function getRateLimit(resource) {
  return limits[resource] ?? null
}

/** Forget everything, e.g. when a token is added and the limits change. */
export function resetRateLimits() {
  for (const key of Object.keys(limits)) delete limits[key]
  emit()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRateLimit(resource = 'core') {
  return useSyncExternalStore(subscribe, () => limits[resource] ?? null)
}
