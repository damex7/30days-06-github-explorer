import { useId } from 'react'
import { cx } from '../../lib/cx.js'

const CONTROL = 'h-10 w-full rounded-xl border border-line-strong bg-panel px-3 text-sm text-ink'

/** A native <select> with a visible label. Native = keyboard and screen readers work for free. */
export function Select({ label, value, onChange, children, className }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cx(CONTROL, 'pr-8')}>
        {children}
      </select>
    </div>
  )
}

export function TextInput({ label, value, onChange, className, ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={CONTROL} {...props} />
    </div>
  )
}

export function Checkbox({ label, checked, onChange, className }) {
  const id = useId()
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded accent-[var(--color-primary)]"
      />
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
    </div>
  )
}
