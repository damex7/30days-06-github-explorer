import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/*
  Filters, sort and tabs live in the URL (?sort=stars&lang=Go) rather than
  in useState. That makes every view shareable and bookmarkable, and the
  Back button undoes a filter change.

  update({ sort: 'forks', lang: null }) changes some keys and deletes the
  null ones. Pass { replace: true } for keystrokes, so typing "react" adds
  one history entry instead of five.
*/
export function useUrlParams() {
  const [params, setParams] = useSearchParams()

  const update = useCallback(
    (changes, { replace = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          return next
        },
        { replace },
      )
    },
    [setParams],
  )

  return [params, update]
}
