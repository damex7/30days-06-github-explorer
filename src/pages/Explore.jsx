import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import RateLimitBadge from '../components/RateLimitBadge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { Select } from '../components/ui/Field.jsx'
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, UsersIcon } from '../components/ui/Icons.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useUrlParams } from '../hooks/useUrlParams.js'
import { cx } from '../lib/cx.js'
import { formatNumber } from '../lib/format.js'
import { SEARCH_PER_PAGE, buildUserQuery, searchUsers } from '../lib/github.js'
import { pageFromUrl } from '../lib/linkHeader.js'

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Kano', 'Benin City', 'Kaduna']
const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Dart', 'Go', 'PHP', 'C#', 'Rust', 'Swift', 'Ruby', 'C++']
// GitHub search only ever returns the first 1,000 matches.
const MAX_RESULTS = 1000
const MAX_PAGE = Math.ceil(MAX_RESULTS / SEARCH_PER_PAGE)

export default function Explore() {
  const [params, updateParams] = useUrlParams()
  const location = params.get('location')?.trim() ?? ''
  const language = params.get('language') ?? ''
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), MAX_PAGE)
  useDocumentTitle(location ? `Developers in ${location}` : 'Explore developers')

  const results = useAsync(location ? (signal) => searchUsers({ location, language, page }, { signal }) : null, [location, language, page])

  // The form keeps a draft so typing doesn't fire a search on every key
  // (search allows only 10 requests a minute). Sync it when the URL changes.
  const [draft, setDraft] = useState(location)
  useEffect(() => setDraft(location), [location])

  const search = (changes) => updateParams({ page: null, ...changes })
  const pageLink = (n) => {
    const next = new URLSearchParams(params)
    if (n === 1) next.delete('page')
    else next.set('page', n)
    return `?${next}`
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Discover developers</h1>
          <p className="mt-1 text-ink-soft">Find developers by city, most-followed first.</p>
        </div>
        <RateLimitBadge resource="search" label="Search" />
      </header>

      <Card className="p-4 sm:p-5">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            search({ location: draft.trim() || null })
          }}
        >
          <LocationInput value={draft} onChange={setDraft} />
          <Select label="Language (optional)" value={language} onChange={(v) => search({ language: v || null })}>
            <option value="">Any language</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink-faint uppercase">Quick picks</span>
          {CITIES.map((city) => (
            <Link
              key={city}
              to={`?${new URLSearchParams({ location: city, ...(language && { language }) })}`}
              aria-current={city.toLowerCase() === location.toLowerCase() ? 'true' : undefined}
              className={cx(
                'inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium',
                city.toLowerCase() === location.toLowerCase()
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line-strong bg-panel text-ink hover:border-primary hover:bg-primary-soft hover:text-primary',
              )}
            >
              {city}
            </Link>
          ))}
        </div>
        {location && (
          <p className="mt-3 text-xs text-ink-faint">
            Query sent to GitHub: <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-ink-soft">{buildUserQuery({ location, language })}</code>
          </p>
        )}
      </Card>

      {results.status === 'idle' && (
        <EmptyState
          icon={<MapPinIcon size={22} />}
          title="Pick a city to start"
          message="Search matches the free-text location people write on their profile, so try spellings like “Port Harcourt” or “PH”."
        />
      )}
      {results.status === 'loading' && <ResultsSkeleton />}
      {results.status === 'error' && (
        <ErrorState
          error={results.error}
          onRetry={results.retry}
          messages={{ invalid: { message: `${results.error?.message} Try a simpler location, without special characters.` } }}
        />
      )}
      {results.status === 'success' && (
        <Results data={results.data} location={location} language={language} page={page} pageLink={pageLink} onClearLanguage={() => search({ language: null })} />
      )}
    </div>
  )
}

function LocationInput({ value, onChange }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-ink-soft">
        City or location
      </label>
      <div className="relative">
        <MapPinIcon size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Lagos"
          maxLength={60}
          className="h-10 w-full rounded-xl border border-line-strong bg-panel pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint"
        />
      </div>
    </div>
  )
}

function Results({ data: { data, links }, location, language, page, pageLink, onClearLanguage }) {
  const total = data.total_count
  // The Link header's rel="last" tells us how many pages exist; GitHub caps it at 1,000 results.
  const lastPage = Math.min(pageFromUrl(links.last) ?? page, MAX_PAGE)

  if (total === 0 || data.items.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon size={22} />}
        title={`No developers found in “${location}”${language ? ` using ${language}` : ''}`}
        message="Try another spelling, a nearby city, or remove the language filter."
        action={language && <Button onClick={onClearLanguage}>Remove language filter</Button>}
      />
    )
  }

  return (
    <section aria-labelledby="results-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="results-title" className="text-lg font-semibold" aria-live="polite">
          {formatNumber(total)} developer{total === 1 ? '' : 's'} in {location}
          {language && ` using ${language}`}
        </h2>
        <p className="text-sm text-ink-faint">
          Page {page} of {lastPage}
          {total > MAX_RESULTS && ' · GitHub shows the first 1,000'}
        </p>
      </div>
      {data.incomplete_results && (
        <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
          GitHub's search timed out before finishing, so these results may be incomplete.
        </p>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.items.map((u) => (
          <li key={u.id}>
            <Link
              to={`/user/${u.login}`}
              className="group flex h-full flex-col items-center rounded-2xl border border-line bg-panel p-4 text-center shadow-card transition-colors hover:border-primary"
            >
              <img src={`${u.avatar_url}&s=128`} alt="" width="64" height="64" loading="lazy" className="size-16 rounded-2xl bg-panel-2" />
              <span className="mt-3 max-w-full truncate font-semibold text-ink group-hover:text-primary">{u.login}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                View profile <ArrowRightIcon size={12} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-faint">
        Search results only include usernames and photos. Each profile loads when you open it, so a page of results costs one request, not {SEARCH_PER_PAGE + 1}.
      </p>

      {lastPage > 1 && (
        <nav aria-label="Results pages" className="mt-6 flex items-center justify-center gap-2">
          <PageLink to={links.prev ? pageLink(page - 1) : null} icon={<ArrowLeftIcon size={15} />}>
            Previous
          </PageLink>
          <span className="px-3 text-sm text-ink-soft tabular" aria-current="page">
            {page} / {lastPage}
          </span>
          <PageLink to={links.next && page < MAX_PAGE ? pageLink(page + 1) : null} icon={<ArrowRightIcon size={15} />} iconAfter>
            Next
          </PageLink>
        </nav>
      )}
    </section>
  )
}

function PageLink({ to, icon, iconAfter, children }) {
  const content = iconAfter ? (
    <>
      {children}
      {icon}
    </>
  ) : (
    <>
      {icon}
      {children}
    </>
  )
  const cls = 'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold'
  if (!to)
    return (
      <span aria-disabled="true" className={cx(cls, 'cursor-not-allowed border-line text-ink-faint')}>
        {content}
      </span>
    )
  return (
    <Link to={to} className={cx(cls, 'border-line-strong bg-panel text-ink hover:bg-panel-2')}>
      {content}
    </Link>
  )
}

function ResultsSkeleton() {
  return (
    <LoadingRegion label="Searching" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-panel p-4">
          <Skeleton variant="rect" width="4rem" height="4rem" />
          <Skeleton width="70%" />
        </div>
      ))}
    </LoadingRegion>
  )
}
