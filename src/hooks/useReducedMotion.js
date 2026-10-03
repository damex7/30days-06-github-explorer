import { useSyncExternalStore } from 'react'

// Turn chart animations off when the user asked their OS for less motion.
const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

function subscribe(callback) {
  query?.addEventListener('change', callback)
  return () => query?.removeEventListener('change', callback)
}

export const useReducedMotion = () => useSyncExternalStore(subscribe, () => query?.matches ?? false)
