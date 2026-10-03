import { useMemo } from 'react'
import { formatNumber } from '../../lib/format.js'
import { SORTS, applyRepoFilters, languagesIn } from '../../lib/repos.js'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import { Checkbox, Select, TextInput } from '../ui/Field.jsx'
import { BookIcon } from '../ui/Icons.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'
import RepoCard from './RepoCard.jsx'

/*
  The full repository list: filters (stored in the URL by the parent),
  results, and "Load more", which follows the Link header's rel="next".
*/
export default function RepoSection({ reposState, totalRepos, filters, setFilters, colorMap, readmeLink }) {
  const { status, repos, error, retry, hasMore, loadMore, loadingMore, moreError, page, lastPage } = reposState
  const visible = useMemo(() => applyRepoFilters(repos, filters), [repos, filters])
  const languages = useMemo(() => languagesIn(repos), [repos])
  const isFiltered = filters.language || filters.hideForks || filters.query
  const clearFilters = () => setFilters({ lang: null, forks: null, q: null })

  return (
    <section aria-labelledby="repos-title">
      <h2 id="repos-title" className="sr-only">
        Repositories
      </h2>

      <div className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-line bg-panel p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
        <TextInput
          label="Filter by name"
          type="search"
          placeholder="e.g. api"
          value={filters.query}
          onChange={(v) => setFilters({ q: v || null }, { replace: true })}
          className="col-span-2 sm:col-span-1"
        />
        <Select label="Sort" value={filters.sort} onChange={(v) => setFilters({ sort: v })}>
          {Object.entries(SORTS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select label="Language" value={filters.language} onChange={(v) => setFilters({ lang: v || null })}>
          <option value="">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
          <option value="__none">No language</option>
        </Select>
        <Checkbox
          label="Hide forks"
          checked={filters.hideForks}
          onChange={(v) => setFilters({ forks: v ? 'hide' : null })}
          className="col-span-2 h-10 sm:col-span-1"
        />
      </div>

      {status === 'loading' && <RepoGridSkeleton />}
      {status === 'error' && <ErrorState error={error} onRetry={retry} />}

      {status === 'success' && (
        <>
          {/* Polite live region: screen readers hear the new count after filtering */}
          <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
            Showing <strong className="text-ink">{formatNumber(visible.length)}</strong> of {formatNumber(repos.length)} loaded
            {totalRepos > repos.length && <> ({formatNumber(totalRepos)} public in total)</>}
            {hasMore && filters.sort !== 'updated' && ' · load more for an exact ranking'}
          </p>

          {repos.length === 0 ? (
            <EmptyState icon={<BookIcon size={22} />} title="No public repositories" message="This account hasn't published any repositories yet." />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No repositories match"
              message="Try another language or clear the filters."
              action={<Button onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((repo) => (
                <RepoCard key={repo.id} repo={repo} color={colorMap.get(repo.language)} readmeTo={readmeLink(repo.name)} />
              ))}
            </ul>
          )}

          {moreError && <ErrorState compact error={moreError} onRetry={loadMore} />}
          {hasMore && !moreError && (
            <div className="mt-5 flex flex-col items-center gap-1">
              <Button onClick={loadMore} loading={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more repositories'}
              </Button>
              <p className="text-xs text-ink-faint">
                Page {page} of {lastPage} · uses 1 request
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function RepoGridSkeleton({ count = 6 }) {
  return (
    <LoadingRegion label="Loading repositories" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line bg-panel p-4">
          <Skeleton width="50%" height="1rem" />
          <Skeleton lines={2} />
          <Skeleton width="70%" />
        </div>
      ))}
    </LoadingRegion>
  )
}
