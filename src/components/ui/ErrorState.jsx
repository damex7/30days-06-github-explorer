import { useCountdown } from '../../hooks/useCountdown.js'
import { openSettings } from '../../lib/events.js'
import { cx } from '../../lib/cx.js'
import { formatClock, formatDuration, spokenDuration } from '../../lib/format.js'
import Button from './Button.jsx'
import { AlertIcon, ClockIcon, KeyIcon, RefreshIcon, UserIcon, WifiOffIcon } from './Icons.jsx'

/*
  One error view for every GitHubError kind. Pages can override the copy
  per kind (e.g. a 404 on a profile reads "No GitHub user called X").

  Rate limits get special treatment: a live countdown to the reset time,
  and Retry stays disabled until the limit has refilled.
*/
const DEFAULTS = {
  'not-found': { icon: UserIcon, title: 'Not found', tone: 'neutral' },
  'rate-limit': { icon: ClockIcon, title: "GitHub's rate limit reached", tone: 'warning' },
  invalid: { icon: AlertIcon, title: "GitHub couldn't run that search", tone: 'warning' },
  'bad-token': { icon: KeyIcon, title: 'Your token was rejected', tone: 'danger' },
  network: { icon: WifiOffIcon, title: "You're offline, or GitHub is unreachable", tone: 'danger' },
}

const TONES = {
  neutral: 'bg-panel-2 text-ink-soft',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export default function ErrorState({ error, onRetry, messages = {}, compact = false, className }) {
  const kind = error?.kind ?? 'unknown'
  const base = DEFAULTS[kind] ?? { icon: AlertIcon, title: 'Something went wrong', tone: 'danger' }
  const override = messages[kind] ?? {}
  const Icon = base.icon
  const title = override.title ?? base.title
  const message = override.message ?? error?.message ?? 'Please try again.'

  return (
    <div
      role="alert"
      className={cx('flex flex-col items-center text-center', compact ? 'px-4 py-6' : 'px-6 py-12', className)}
    >
      <div className={cx('flex size-11 items-center justify-center rounded-full', TONES[base.tone])}>
        <Icon size={22} />
      </div>
      <p className="mt-3 font-display text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{message}</p>

      {kind === 'rate-limit' ? (
        <RateLimitActions resetAt={error.resetAt} onRetry={onRetry} />
      ) : (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {kind === 'bad-token' && (
            <Button size="sm" variant="primary" icon={<KeyIcon size={15} />} onClick={openSettings}>
              Fix or remove token
            </Button>
          )}
          {onRetry && kind !== 'not-found' && (
            <Button size="sm" icon={<RefreshIcon size={15} />} onClick={onRetry}>
              Try again
            </Button>
          )}
          {override.action}
        </div>
      )}
    </div>
  )
}

function RateLimitActions({ resetAt, onRetry }) {
  const left = useCountdown(resetAt)
  return (
    <>
      {resetAt && (
        <p className="mt-4 rounded-full bg-panel-2 px-4 py-1.5 text-sm text-ink">
          {left > 0 ? (
            <>
              {/* The ticking number is hidden from screen readers so they aren't interrupted every second */}
              <span aria-hidden="true">
                Resets in <strong className="font-mono tabular">{formatDuration(left)}</strong>
              </span>
              <span className="sr-only">Resets in about {spokenDuration(left)}</span>
              <span className="text-ink-faint"> · at {formatClock(resetAt)}</span>
            </>
          ) : (
            'The limit has reset. You can try again now.'
          )}
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button size="sm" icon={<RefreshIcon size={15} />} onClick={onRetry} disabled={left > 0}>
            {left > 0 ? 'Retry when reset' : 'Try again'}
          </Button>
        )}
        <Button size="sm" variant="primary" icon={<KeyIcon size={15} />} onClick={openSettings}>
          Add a token
        </Button>
      </div>
    </>
  )
}
