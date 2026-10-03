import { useCallback, useSyncExternalStore } from 'react'

/*
  Recently viewed usernames, newest first, kept in localStorage so they
  survive closing the browser. Only usernames that actually loaded are
  added (see the Profile page), so typos never end up here.
*/
const KEY = 'scout-recent'
const MAX = 8
const listeners = new Set()
let cached = null

function read() {
  if (cached) return cached
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    cached = Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    cached = []
  }
  return cached
}

function write(list) {
  cached = list
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Storage blocked: recent searches last for this visit only.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function addRecentSearch(login) {
  const rest = read().filter((x) => x.toLowerCase() !== login.toLowerCase())
  write([login, ...rest].slice(0, MAX))
}

export function useRecentSearches() {
  const recent = useSyncExternalStore(subscribe, read)
  const remove = useCallback((login) => write(read().filter((x) => x !== login)), [])
  const clear = useCallback(() => write([]), [])
  return { recent, remove, clear }
}
