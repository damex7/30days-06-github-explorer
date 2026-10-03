import { useCallback, useEffect, useState } from 'react'

/*
  Runs an async loader and tracks { status, data, error }.
  This is the small piece of what React Query would do for us, written by
  hand so the moving parts are visible:

  - The loader gets an AbortSignal. When deps change (e.g. you open another
    profile) or the component unmounts, the old request is cancelled, so a
    slow old response can never overwrite the new one.
  - retry() re-runs the loader with the same deps.
  - Pass `null` as the loader to stay idle (e.g. no search yet).
*/
export function useAsync(loader, deps) {
  const [state, setState] = useState({ status: loader ? 'loading' : 'idle', data: undefined, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!loader) {
      setState({ status: 'idle', data: undefined, error: null })
      return
    }
    const controller = new AbortController()
    setState({ status: 'loading', data: undefined, error: null })
    loader(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: null })
      },
      (error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return
        setState({ status: 'error', data: undefined, error })
      },
    )
    return () => controller.abort()
    // The caller's deps decide when to reload; `loader` is a new function every render.
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, retry }
}
