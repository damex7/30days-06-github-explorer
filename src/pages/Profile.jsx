import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProfileHeader, { ProfileHeaderSkeleton } from '../components/profile/ProfileHeader.jsx'
import RepoCard from '../components/profile/RepoCard.jsx'
import RepoSection, { RepoGridSkeleton } from '../components/profile/RepoSection.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { ArrowRightIcon, BookIcon } from '../components/ui/Icons.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { addRecentSearch } from '../hooks/useRecentSearches.js'
import { useRepos } from '../hooks/useRepos.js'
import { useUrlParams } from '../hooks/useUrlParams.js'
import { cx } from '../lib/cx.js'
import { formatNumber } from '../lib/format.js'
import { getUser } from '../lib/github.js'
import { languageColorMap, languageStats } from '../lib/languages.js'
import { readRepoFilters, topRepos, totalStars } from '../lib/repos.js'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'repos', label: 'Repositories' },
]

export default function Profile() {
  const { username } = useParams()
  const [params, updateParams] = useUrlParams()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview'

  // Two independent requests, started together: the profile and page 1 of repos.
  const user = useAsync((signal) => getUser(username, { signal }), [username])
  const repos = useRepos(username)

  const login = user.data?.login
  useDocumentTitle(login ?? username)
  useEffect(() => {
    if (login) addRecentSearch(login) // only real, loaded users are remembered
  }, [login])

  const filters = useMemo(() => readRepoFilters(params), [params])
  const langStats = useMemo(() => languageStats(repos.repos), [repos.repos])
  const colorMap = useMemo(() => languageColorMap(langStats), [langStats])
  const top = useMemo(() => topRepos(repos.repos), [repos.repos])

  // Keep every current param and add ?readme=name, so closing returns to the same view.
  const readmeLink = (name) => {
    const next = new URLSearchParams(params)
    next.set('readme', name)
    return `?${next}`
  }
  const tabLink = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'overview') next.delete('tab')
    else next.set('tab', id)
    return `?${next}`
  }

  if (user.status === 'error') {
    return (
      <ErrorState
        error={user.error}
        onRetry={user.retry}
        messages={{
          'not-found': {
            title: `No GitHub user called “${username}”`,
            message: 'Check the spelling. It may also be an organisation, a renamed account, or one that was deleted.',
            action: (
              <Button as={Link} to="/" variant="primary">
                Search again
              </Button>
            ),
          },
        }}
      />
    )
  }

  const stars =
    repos.status === 'success'
      ? {
          value: totalStars(repos.repos),
          note: repos.hasMore ? `from ${formatNumber(repos.repos.length)} of ${formatNumber(user.data?.public_repos ?? 0)} repos` : null,
        }
      : { value: repos.status === 'error' ? 0 : null, note: repos.status === 'error' ? 'Repos unavailable' : null }

  return (
    <div className="animate-fade-in space-y-6">
      {user.status === 'loading' ? <ProfileHeaderSkeleton /> : <ProfileHeader user={user.data} stars={stars} />}

      <nav aria-label="Profile sections" className="border-b border-line">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <li key={t.id}>
              <Link
                to={tabLink(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cx(
                  'inline-flex h-11 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap',
                  tab === t.id ? 'border-accent text-ink' : 'border-transparent text-ink-soft hover:text-ink',
                )}
              >
                {t.label}
                {t.id === 'repos' && user.data && (
                  <span className="ml-2 rounded-full bg-panel-2 px-2 py-0.5 text-xs tabular">{formatNumber(user.data.public_repos)}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'overview' && (
        <section aria-labelledby="top-title">
          <div className="flex items-end justify-between gap-3">
            <h2 id="top-title" className="text-lg font-semibold">
              Top repositories
            </h2>
            <Link to={tabLink('repos')} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              All repositories <ArrowRightIcon size={15} />
            </Link>
          </div>
          {repos.status === 'loading' && <RepoGridSkeleton />}
          {repos.status === 'error' && <ErrorState error={repos.error} onRetry={repos.retry} />}
          {repos.status === 'success' &&
            (top.length === 0 ? (
              <EmptyState icon={<BookIcon size={22} />} title="No original repositories yet" message="Only forks or archived repositories so far." />
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {top.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} color={colorMap.get(repo.language)} readmeTo={readmeLink(repo.name)} />
                ))}
              </ul>
            ))}
        </section>
      )}

      {tab === 'repos' && (
        <RepoSection
          reposState={repos}
          totalRepos={user.data?.public_repos ?? 0}
          filters={filters}
          setFilters={updateParams}
          colorMap={colorMap}
          readmeLink={readmeLink}
        />
      )}
    </div>
  )
}
