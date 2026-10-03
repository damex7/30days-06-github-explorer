import { cx } from '../../lib/cx.js'

const SHAPES = { text: 'h-3.5 rounded', rect: 'rounded-xl', circle: 'rounded-full' }

/** A placeholder that pulses while content loads. Hidden from screen readers. */
export default function Skeleton({ variant = 'text', width, height, lines = 1, className }) {
  const style = { width, height }
  const block = (key, extra) => (
    <span
      key={key}
      aria-hidden="true"
      style={{ ...style, ...extra }}
      className={cx('block animate-shimmer bg-panel-2', SHAPES[variant], className)}
    />
  )
  if (lines === 1) return block()
  // Several text lines: the last one is shorter, like a real paragraph.
  return (
    <span className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => block(i, i === lines - 1 ? { width: '60%' } : null))}
    </span>
  )
}

/** Wraps a group of skeletons so screen readers hear "Loading…" once. */
export function LoadingRegion({ label = 'Loading', className, children }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  )
}
