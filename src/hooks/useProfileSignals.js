import { useEffect, useState } from 'react'
import { detectDefaultAvatar } from '../lib/avatar.js'
import { hasProfileReadmeRepo } from '../lib/github.js'
import { useAsync } from './useAsync.js'

/*
  Does {login}/{login} exist? Answer it with as few requests as possible:
  1. it's in the repos we already loaded → yes, no request;
  2. every page is loaded and it isn't there → no, no request;
  3. otherwise ask GET /repos/{login}/{login} (404 = no).
*/
export function useProfileReadme(login, reposState) {
  const ready = Boolean(login) && reposState.status === 'success'
  const found = ready && reposState.repos.some((r) => r.name.toLowerCase() === login.toLowerCase())
  const knownAbsent = ready && !found && !reposState.hasMore
  const needsRequest = ready && !found && !knownAbsent

  const remote = useAsync(needsRequest ? (signal) => hasProfileReadmeRepo(login, { signal }) : null, [login, needsRequest])

  if (!ready) return { status: reposState.status === 'error' ? 'error' : 'loading', value: null }
  if (found) return { status: 'success', value: true }
  if (knownAbsent) return { status: 'success', value: false }
  if (remote.status === 'error') return { status: 'error', value: null, error: remote.error, retry: remote.retry }
  return { status: remote.status === 'success' ? 'success' : 'loading', value: remote.data ?? null }
}

/** true = uploaded photo, false = default identicon, null = couldn't tell. Costs no API request. */
export function useCustomAvatar(avatarUrl) {
  const [result, setResult] = useState({ url: null, value: null })

  useEffect(() => {
    if (!avatarUrl) return
    let cancelled = false
    detectDefaultAvatar(avatarUrl).then((isDefault) => {
      if (!cancelled) setResult({ url: avatarUrl, value: isDefault === null ? null : !isDefault })
    })
    return () => {
      cancelled = true
    }
  }, [avatarUrl])

  const done = result.url === avatarUrl
  return { status: done ? 'success' : 'loading', value: done ? result.value : null }
}
