import { useCountdown } from '../hooks/useCountdown.js'
import { cx } from '../lib/cx.js'
import { formatDuration, formatNumber } from '../lib/format.js'
import { useRateLimit } from '../lib/rateLimit.js'
import { openSettings } from '../lib/events.js'

/*
  "52/60" in the header, from the latest x-ratelimit-* headers.
  Turns amber under 20%, red at 0, and then shows the reset countdown.
  It's a button: clicking opens the token settings, where the limit is explained.
*/
export default function RateLimitBadge({ resource = 'core', label = 'API', className }) {
  const limit = useRateLimit(resource)
  const left = useCountdown(limit?.remaining === 0 ? limit.reset : null)

  if (!limit) return null
  const { remaining, limit: max } = limit
  const tone = remaining === 0 ? 'danger' : remaining / max < 0.2 ? 'warning' : 'ok'
  const period = resource === 'search' ? 'this minute' : 'this hour'

  return (
    <button
      type="button"
      onClick={openSettings}
      title={`GitHub ${resource} requests left ${period}. Click to raise the limit with a token.`}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold tabular',
        tone === 'ok' && 'border-line bg-panel text-ink-soft hover:bg-panel-2',
        tone === 'warning' && 'border-warning/40 bg-warning-soft text-warning',
        tone === 'danger' && 'border-danger/40 bg-danger-soft text-danger',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx('size-2 rounded-full', tone === 'ok' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-danger')}
      />
      <span className="sr-only">
        {label} requests left {period}: {remaining} of {max}.
      </span>
      <span aria-hidden="true">
        {label} {formatNumber(remaining)}/{formatNumber(max)}
        {remaining === 0 && left > 0 && <> · {formatDuration(left)}</>}
      </span>
    </button>
  )
}
