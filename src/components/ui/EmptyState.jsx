import { cx } from '../../lib/cx.js'
import { InboxIcon } from './Icons.jsx'

/** "Nothing here" message with an optional action (e.g. Clear filters). */
export default function EmptyState({
  icon = <InboxIcon size={22} />,
  title = 'Nothing to show',
  message,
  action,
  compact = false,
  className,
}) {
  return (
    <div className={cx('flex flex-col items-center text-center', compact ? 'px-4 py-6' : 'px-6 py-12', className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-panel-2 text-ink-soft">{icon}</div>
      <p className="mt-3 font-display text-base font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
