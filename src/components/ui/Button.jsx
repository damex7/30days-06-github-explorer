import { cx } from '../../lib/cx.js'

// Full class strings (not built with template literals) so Tailwind can find them.
const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-sm',
  secondary: 'bg-panel text-ink border border-line-strong hover:bg-panel-2',
  ghost: 'text-ink-soft hover:bg-panel-2 hover:text-ink',
  danger: 'bg-panel text-danger border border-danger hover:bg-danger-soft',
}

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-base',
}

const ICON_ONLY_SIZES = { sm: 'size-8', md: 'size-10', lg: 'size-12' }

/*
  One button for the whole app. `as` lets it render a router <Link> or an <a>
  with button styling. Icon-only buttons must get an aria-label.
*/
export default function Button({
  as: Component = 'button',
  variant = 'secondary',
  size = 'md',
  icon,
  iconOnly = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isButton = Component === 'button'
  return (
    <Component
      type={isButton ? 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {!iconOnly && children}
    </Component>
  )
}

export function Spinner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cx('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)}
    />
  )
}
