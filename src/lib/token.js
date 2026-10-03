import { useSyncExternalStore } from 'react'

/*
  The visitor's optional personal access token.

  It lives ONLY in this browser's localStorage under TOKEN_KEY. It is never
  in the code, the repo or any server of ours (there isn't one): request()
  sends it straight to api.github.com and nowhere else.

  localStorage is readable by any script running on this page, which is
  one reason the README preview is sanitised with DOMPurify.
*/

export const TOKEN_KEY = 'scout-gh-token'
const listeners = new Set()

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token.trim())
  } catch {
    // Storage blocked: the token can't be kept.
  }
  listeners.forEach((l) => l())
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing stored.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  // Another tab changed it: stay in sync.
  const onStorage = (event) => event.key === TOKEN_KEY && listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** true when a token is saved. Components never need the token itself. */
export function useHasToken() {
  return useSyncExternalStore(subscribe, () => getToken() !== '')
}
