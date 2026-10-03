import { useCallback, useEffect, useRef, useState } from 'react'
import { getNextPage, getRepos } from '../lib/github.js'
import { pageFromUrl } from '../lib/linkHeader.js'

/*
  A user's repositories, one page (100 repos) at a time.

  We never compute "page 2" ourselves. Each response's Link header says
  where the next page is (rel="next") and how many there are (rel="last").
  When there's no rel="next", we've reached the end.
*/
const INITIAL = { status: 'loading', repos: [], next: null, lastPage: null, page: 1, error: null, loadingMore: false, moreError: null }

export function useRepos(username) {
  const [state, setState] = useState(INITIAL)
  const [attempt, setAttempt] = useState(0)
  const controllerRef = useRef(null)

  useEffect(() => {
    // No username (e.g. an empty Compare slot): stay idle, make no request.
    if (!username) {
      setState({ ...INITIAL, status: 'idle' })
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setState(INITIAL)
    getRepos(username, { signal: controller.signal }).then(
      ({ data, links }) => {
        if (controller.signal.aborted) return
        setState({ ...INITIAL, status: 'success', repos: data, next: links.next ?? null, lastPage: pageFromUrl(links.last) ?? 1 })
      },
      (error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return
        setState({ ...INITIAL, status: 'error', error })
      },
    )
    return () => controller.abort()
  }, [username, attempt])

  const loadMore = useCallback(async () => {
    const url = state.next
    if (!url || state.loadingMore) return
    const controller = controllerRef.current
    setState((s) => ({ ...s, loadingMore: true, moreError: null }))
    try {
      const { data, links } = await getNextPage(url, { signal: controller.signal })
      if (controller.signal.aborted) return
      setState((s) => {
        // Pages are offsets into a live list: if a repo was pushed to between
        // our requests it can shift and appear twice. De-duplicate by id.
        const seen = new Set(s.repos.map((r) => r.id))
        return {
          ...s,
          repos: [...s.repos, ...data.filter((r) => !seen.has(r.id))],
          next: links.next ?? null,
          page: pageFromUrl(url) ?? s.page + 1,
          loadingMore: false,
        }
      })
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') return
      setState((s) => ({ ...s, loadingMore: false, moreError: error }))
    }
  }, [state.next, state.loadingMore])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, hasMore: Boolean(state.next), loadMore, retry }
}
