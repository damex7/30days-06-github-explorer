import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx.js'
import { TOP_REPO_COUNT, WEIGHTS } from '../../lib/score.js'
import Card from '../ui/Card.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import { ArrowRightIcon, CheckIcon, XCircleIcon } from '../ui/Icons.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'
import ScoreDial from './ScoreDial.jsx'

/** Failed checks first, biggest possible gain first: the most useful order for "what do I fix?". */
const byGain = (a, b) => b.points - b.earned - (a.points - a.earned) || b.points - a.points

export default function RecruiterView({ state, basedOn }) {
  if (state.status === 'loading') return <RecruiterSkeleton />
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={state.retry} />

  const { score, band, checks, passedCount } = state.report
  const todo = checks.filter((c) => !c.passed).sort(byGain)
  const done = checks.filter((c) => c.passed)

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[18rem_1fr]">
      <Card as="section" aria-labelledby="score-title" className="p-5 text-center lg:sticky lg:top-24">
        <h2 id="score-title" className="text-lg font-semibold">
          Recruiter readiness
        </h2>
        <ScoreDial score={score} band={band} className="mt-4" />
        <p className="mt-4 text-sm text-ink-soft">
          Passes <strong className="text-ink">{passedCount}</strong> of {checks.length} checks.
          {todo.length > 0 && ` Fixing the first tip adds up to ${todo[0].points - todo[0].earned} points.`}
        </p>
        {basedOn && <p className="mt-2 text-xs text-ink-faint">{basedOn}</p>}
        <details className="mt-4 text-left text-sm">
          <summary className="cursor-pointer font-semibold text-primary select-none hover:underline">How the score works</summary>
          <div className="mt-2 space-y-2 text-ink-soft">
            <p>
              Eight checks add up to 100 points. Repo checks look at the {TOP_REPO_COUNT} most-starred original repos (no forks or
              archives), because that's what a recruiter clicks first. They give partial credit.
            </p>
            <ul className="space-y-0.5">
              {checks.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>{c.label}</span>
                  <span className="tabular">{WEIGHTS[c.id]}</span>
                </li>
              ))}
            </ul>
            <p>80+ is “Ready to share”, 60–79 “Almost there”, below 60 “Needs work”.</p>
          </div>
        </details>
      </Card>

      <div className="space-y-5">
        {todo.length > 0 && (
          <section aria-labelledby="todo-title">
            <h2 id="todo-title" className="text-lg font-semibold">
              Tips to improve <span className="text-ink-faint">({todo.length})</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {todo.map((c) => (
                <CheckItem key={c.id} check={c} />
              ))}
            </ul>
          </section>
        )}
        {done.length > 0 && (
          <section aria-labelledby="done-title">
            <h2 id="done-title" className="text-lg font-semibold">
              Already strong <span className="text-ink-faint">({done.length})</span>
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {done.map((c) => (
                <CheckItem key={c.id} check={c} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function CheckItem({ check }) {
  const { passed, label, earned, points, detail, tip } = check
  return (
    <li className={cx('rounded-2xl border bg-panel p-4', passed ? 'border-line' : 'border-l-4 border-line border-l-accent')}>
      <div className="flex items-start gap-3">
        <span
          className={cx(
            'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
            passed ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {passed ? <CheckIcon size={15} /> : <XCircleIcon size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="font-sans text-base font-semibold text-ink">
              <span className="sr-only">{passed ? 'Passed: ' : 'Not yet: '}</span>
              {label}
            </h3>
            <span className="font-mono text-sm text-ink-soft tabular">
              {earned}/{points}
              <span className="sr-only"> points</span>
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">{detail}</p>
          {!passed && <p className="mt-2 rounded-xl bg-accent-soft/60 px-3 py-2 text-sm text-pretty text-ink">{tip}</p>}
        </div>
      </div>
    </li>
  )
}

/** Compact version for the Overview tab. */
export function ScoreTeaser({ state, to }) {
  return (
    <Card as="section" aria-labelledby="teaser-title" className="flex flex-col p-5">
      <h2 id="teaser-title" className="text-lg font-semibold">
        Recruiter readiness
      </h2>
      {state.status === 'loading' && (
        <LoadingRegion label="Calculating score" className="mt-4 flex items-center gap-4">
          <Skeleton variant="circle" width="96px" height="96px" />
          <div className="flex-1">
            <Skeleton lines={3} />
          </div>
        </LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState compact error={state.error} onRetry={state.retry} />}
      {state.status === 'success' && (
        <>
          <div className="mt-4 flex items-center gap-5">
            <ScoreDial score={state.report.score} band={state.report.band} size={104} />
            <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
              {state.report.checks
                .filter((c) => !c.passed)
                .sort(byGain)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.id} className="flex gap-2 text-ink-soft">
                    <XCircleIcon size={16} className="mt-0.5 shrink-0 text-danger" />
                    <span>{c.label}</span>
                  </li>
                ))}
              {state.report.passedCount === state.report.checks.length && <li className="text-ink-soft">Every check passes. Nice!</li>}
            </ul>
          </div>
          <Link
            to={to}
            className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline"
          >
            See all checks and tips <ArrowRightIcon size={15} />
          </Link>
        </>
      )}
    </Card>
  )
}

function RecruiterSkeleton() {
  return (
    <LoadingRegion label="Calculating score" className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <Card className="flex flex-col items-center gap-4 p-5">
        <Skeleton width="60%" height="1.25rem" />
        <Skeleton variant="circle" width="148px" height="148px" />
        <Skeleton lines={2} />
      </Card>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-line bg-panel p-4">
            <Skeleton width="40%" height="1rem" />
            <Skeleton lines={2} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
