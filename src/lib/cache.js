/*
  A small response cache in sessionStorage.

  Why: without a token, GitHub allows 60 requests an hour. Opening a
  profile costs 2–3, so going back and forth between a few profiles would
  burn through the limit fast. With the cache, revisiting is free and instant.

  The trade-off:
  - Data can be up to TTL old. A new star or follower won't show for a few
    minutes. That's fine for browsing profiles.
  - sessionStorage (not localStorage) means the cache dies with the tab, so
    stale data can never stick around for days, and nothing piles up.
  - Storage is small (about 5 MB per site). If a write doesn't fit we drop
    the oldest half of our entries and try once more; if it still fails we
    just don't cache. The cache must never break the app.

  Each entry also keeps the response's ETag. When an entry is older than
  the TTL we don't throw it away: request() asks GitHub "has it changed?"
  with If-None-Match, and a 304 lets us reuse it (see lib/github.js).
*/

const PREFIX = 'scout:v1:'
export const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

/** The stored entry { data, link, etag, savedAt }, however old, or null. */
export function readCache(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Young enough to use without asking GitHub at all? */
export const isFresh = (entry, ttl = DEFAULT_TTL) => Date.now() - entry.savedAt <= ttl

export function writeCache(key, value) {
  const raw = JSON.stringify({ ...value, savedAt: Date.now() })
  try {
    sessionStorage.setItem(PREFIX + key, raw)
  } catch {
    evictOldest()
    try {
      sessionStorage.setItem(PREFIX + key, raw)
    } catch {
      // Still too big (or storage is blocked). Skip caching this one.
    }
  }
}

/** Remove every cached response, e.g. after the token changes. */
export function clearCache() {
  try {
    for (const key of ourKeys()) sessionStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing to clear.
  }
}

function ourKeys() {
  const keys = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key?.startsWith(PREFIX)) keys.push(key)
  }
  return keys
}

function evictOldest() {
  try {
    const entries = ourKeys().map((key) => {
      let savedAt = 0
      try {
        savedAt = JSON.parse(sessionStorage.getItem(key)).savedAt
      } catch {
        // Unreadable entry: treat as oldest.
      }
      return { key, savedAt }
    })
    entries.sort((a, b) => a.savedAt - b.savedAt)
    for (const { key } of entries.slice(0, Math.ceil(entries.length / 2))) sessionStorage.removeItem(key)
  } catch {
    // Nothing we can do.
  }
}
