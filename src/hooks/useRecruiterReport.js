import { useMemo } from 'react'
import { scoreProfile } from '../lib/score.js'
import { useCustomAvatar, useProfileReadme } from './useProfileSignals.js'

/*
  Gathers the inputs score.js needs (user, repos, profile README, avatar
  check) and runs it once they're all ready. Shared by Profile and Compare.
*/
export function useRecruiterReport(user, reposState) {
  const login = user.data?.login
  const readme = useProfileReadme(login, reposState)
  const avatar = useCustomAvatar(user.data?.avatar_url)

  const report = useMemo(() => {
    if (user.status !== 'success' || reposState.status !== 'success' || readme.status !== 'success' || avatar.status !== 'success') return null
    return scoreProfile({
      user: user.data,
      repos: reposState.repos,
      hasProfileReadme: readme.value,
      hasCustomAvatar: avatar.value,
      now: Date.now(),
    })
  }, [user.status, user.data, reposState.status, reposState.repos, readme.status, readme.value, avatar.status, avatar.value])

  if (user.status === 'idle') return { status: 'idle' }
  if (user.status === 'error') return { status: 'error', error: user.error, retry: user.retry }
  if (reposState.status === 'error') return { status: 'error', error: reposState.error, retry: reposState.retry }
  if (readme.status === 'error') return { status: 'error', error: readme.error, retry: readme.retry }
  return report ? { status: 'success', report } : { status: 'loading' }
}
