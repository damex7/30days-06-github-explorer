import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ScoreDial from '../components/profile/ScoreDial.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { CompareIcon, RefreshIcon } from '../components/ui/Icons.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useRecruiterReport } from '../hooks/useRecruiterReport.js'
import { useRepos } from '../hooks/useRepos.js'
import { useUrlParams } from '../hooks/useUrlParams.js'
import { cx } from '../lib/cx.js'
import { formatMonthYear, formatNumber, timeAgo } from '../lib/format.js'
import { getUser } from '../lib/github.js'
import { languageStats } from '../lib/languages.js'
import { totalStars } from '../lib/repos.js'
import { cleanUsername, validateUsername } from '../lib/username.js'

/** ?users=a,b → ['a', 'b'], dropping anything that isn't a valid username. */
function readUsers(params) {
  return (params.get('users') ?? '')
    .split(',')
    .map(cleanUsername)
    .filter((u) => u && !validateUsername(u))
    .slice(0, 2)
}

/** Everything one column needs: profile, first page of repos, score and languages. */
function useCompareSlot(login) {
  const user = useAsync(login ? (signal) => getUser(login, { signal }) : null, [login])
  const repos = useRepos(login)
  const report = useRecruiterReport(user, repos)
  const langs = useMemo(() => languageStats(repos.repos), [repos.repos])
  return { login, user, repos, report, langs }
}

export default function Compare() {
  const [params, updateParams] = useUrlParams()
  const [a = '', b = ''] = readUsers(params)
  useDocumentTitle(a && b ? `${a} vs ${b}` : 'Compare profiles')

  const slots = [useCompareSlot(a), useCompareSlot(b)]
  const bothReady = slots.every((s) => s.user.status === 'success' && s.repos.status === 'success' && s.report.status === 'success')

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Compare profiles</h1>
        <p className="mt-1 text-ink-soft">Two developers side by side: stats, languages and recruiter readiness.</p>
      </header>

      <CompareForm key={`${a},${b}`} initial={[a, b]} onSubmit={(users) => updateParams({ users: users.filter(Boolean).join(',') || null })} />

      {!a && !b ? (
        <EmptyState
          icon={<CompareIcon size={22} />}
          title="Choose two developers"
          message="Enter two GitHub usernames above, or try an example."
          action={
            <Button as={Link} to="?users=gaearon,sindresorhus">
              gaearon vs sindresorhus
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {slots.map((slot, i) => (
              <SlotHeader key={i} slot={slot} />
            ))}
          </div>
          {bothReady && <HeadToHead slots={slots} />}
          {!bothReady && slots.every((s) => s.user.status !== 'error') && a && b && <TableSkeleton />}
        </>
      )}
    </div>
  )
}

function CompareForm({ initial, onSubmit }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState(['', ''])
  const ids = [useId(), useId()]

  function submit(event) {
    event.preventDefault()
    const cleaned = values.map(cleanUsername)
    // An empty second box is allowed (compare later); a malformed name is not.
    const problems = cleaned.map((v, i) => (v || i === 0 ? validateUsername(v) : ''))
    setErrors(problems)
    if (problems.some(Boolean)) return
    onSubmit(cleaned)
  }

  return (
    <Card as="form" onSubmit={submit} noValidate className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-start sm:p-5">
      {[0, 1].map((i) => (
        <div key={i} className={i === 1 ? 'sm:order-3' : ''}>
          <label htmlFor={ids[i]} className="mb-1 block text-xs font-semibold text-ink-soft">
            {i === 0 ? 'First developer' : 'Second developer'}
          </label>
          <input
            id={ids[i]}
            value={values[i]}
            placeholder={i === 0 ? 'e.g. gaearon' : 'e.g. sindresorhus'}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck="false"
            onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
            aria-invalid={errors[i] ? true : undefined}
            aria-describedby={errors[i] ? `${ids[i]}-err` : undefined}
            className={cx('h-10 w-full rounded-xl border bg-panel px-3 text-sm text-ink placeholder:text-ink-faint', errors[i] ? 'border-danger' : 'border-line-strong')}
          />
          {errors[i] && (
            <p id={`${ids[i]}-err`} className="mt-1 text-xs font-medium text-danger">
              {errors[i]}
            </p>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        iconOnly
        icon={<RefreshIcon size={16} />}
        aria-label="Swap the two developers"
        title="Swap"
        className="justify-self-center sm:order-2 sm:mt-5"
        onClick={() => setValues(([x, y]) => [y, x])}
      />
      <Button type="submit" variant="primary" className="sm:order-4 sm:mt-5">
        Compare
      </Button>
    </Card>
  )
}

function SlotHeader({ slot }) {
  const { login, user, report } = slot
  if (!login) {
    return (
      <Card className="flex items-center justify-center p-5 text-center text-sm text-ink-faint">Add a second username to compare.</Card>
    )
  }
  if (user.status === 'loading') {
    return (
      <LoadingRegion label={`Loading ${login}`}>
        <Card className="flex flex-col items-center gap-3 p-5">
          <Skeleton variant="rect" width="4.5rem" height="4.5rem" />
          <Skeleton width="60%" />
          <Skeleton variant="circle" width="96px" height="96px" />
        </Card>
      </LoadingRegion>
    )
  }
  if (user.status === 'error') {
    return (
      <Card>
        <ErrorState
          compact
          error={user.error}
          onRetry={user.retry}
          messages={{ 'not-found': { title: `No user “${login}”`, message: 'Check the spelling and try again.' } }}
        />
      </Card>
    )
  }
  const u = user.data
  return (
    <Card as="section" aria-label={u.name || u.login} className="flex flex-col items-center p-4 text-center sm:p-5">
      <img src={`${u.avatar_url}&s=144`} alt={`Profile photo of ${u.name || u.login}`} width="72" height="72" className="size-18 rounded-2xl border border-line" />
      <h2 className="mt-3 max-w-full truncate text-base font-semibold sm:text-lg">{u.name || u.login}</h2>
      <Link to={`/user/${u.login}`} className="max-w-full truncate font-mono text-sm text-primary hover:underline">
        @{u.login}
      </Link>
      <div className="mt-4 min-h-[9rem]">
        {report.status === 'success' && <ScoreDial score={report.report.score} band={report.report.band} size={104} />}
        {report.status === 'loading' && <Skeleton variant="circle" width="104px" height="104px" />}
        {report.status === 'error' && <ErrorState compact error={report.error} onRetry={report.retry} />}
      </div>
    </Card>
  )
}

function lastPush(repos) {
  return repos.filter((r) => !r.fork).reduce((max, r) => (r.pushed_at > max ? r.pushed_at : max), '')
}

/** Builds rows of [label, valueA, valueB, how to compare]. */
function buildRows([A, B]) {
  const num = (label, get, note) => ({ label, note, values: [get(A), get(B)], format: formatNumber, higherWins: true })
  const rows = [
    num('Readiness score', (s) => s.report.report.score),
    num('Followers', (s) => s.user.data.followers),
    num('Public repos', (s) => s.user.data.public_repos),
    num('Total stars', (s) => totalStars(s.repos.repos), 'from the first 100 repos'),
    {
      label: 'Last push',
      values: [lastPush(A.repos.repos), lastPush(B.repos.repos)],
      format: (v) => (v ? timeAgo(v) : '—'),
      higherWins: true, // later ISO date string sorts higher
    },
    { label: 'Joined', values: [A.user.data.created_at, B.user.data.created_at], format: formatMonthYear },
    {
      label: 'Top languages',
      values: [A.langs, B.langs],
      render: (stats) => (stats.rows.length ? stats.rows.filter((r) => !r.isOther).slice(0, 3).map((r) => r.language).join(', ') : '—'),
    },
  ]
  // One row per readiness check: earned / possible points.
  const checks = A.report.report.checks.map((check, i) => ({
    label: check.label,
    group: 'checks',
    values: [check.earned, B.report.report.checks[i].earned],
    format: (v) => `${v}/${check.points}`,
    higherWins: true,
  }))
  return { rows, checks }
}

function HeadToHead({ slots }) {
  const { rows, checks } = buildRows(slots)
  const [A, B] = slots.map((s) => s.user.data.login)
  return (
    <Card as="section" aria-labelledby="h2h-title" className="overflow-hidden">
      <h2 id="h2h-title" className="px-4 pt-4 text-lg font-semibold sm:px-5">
        Head to head
      </h2>
      <p className="px-4 text-sm text-ink-faint sm:px-5">The higher value in each row is marked with ▲.</p>
      <table className="mt-3 w-full table-fixed text-sm">
        <caption className="sr-only">
          {A} compared with {B}
        </caption>
        <thead>
          <tr className="border-y border-line bg-panel-2 text-left text-xs text-ink-soft">
            <th scope="col" className="w-[34%] px-4 py-2 font-semibold sm:px-5">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col" className="truncate px-2 py-2 font-semibold">
              @{A}
            </th>
            <th scope="col" className="truncate px-2 py-2 font-semibold">
              @{B}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <Row key={row.label} row={row} />
          ))}
          <tr>
            <th colSpan={3} scope="colgroup" className="bg-panel-2 px-4 py-2 text-left text-xs font-semibold text-ink-soft uppercase sm:px-5">
              Readiness checks
            </th>
          </tr>
          {checks.map((row) => (
            <Row key={row.label} row={row} />
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function Row({ row }) {
  const [a, b] = row.values
  const winner = row.higherWins && a !== b ? (a > b ? 0 : 1) : null
  return (
    <tr>
      <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink sm:px-5">
        {row.label}
        {row.note && <span className="block text-xs font-normal text-ink-faint">{row.note}</span>}
      </th>
      {[a, b].map((v, i) => (
        <td key={i} className={cx('px-2 py-2.5 break-words tabular', winner === i ? 'font-bold text-ink' : 'text-ink-soft')}>
          {row.render ? row.render(v) : row.format(v)}
          {winner === i && (
            <>
              <span aria-hidden="true" className="ml-1 text-accent">
                ▲
              </span>
              <span className="sr-only"> (higher)</span>
            </>
          )}
        </td>
      ))}
    </tr>
  )
}

function TableSkeleton() {
  return (
    <LoadingRegion label="Loading comparison">
      <Card className="space-y-3 p-5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} height="1.25rem" />
        ))}
      </Card>
    </LoadingRegion>
  )
}
