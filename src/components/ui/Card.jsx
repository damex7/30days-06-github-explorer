import { cx } from '../../lib/cx.js'

/** A white panel. `as` lets a card be a <section> or <article> for landmarks. */
export default function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component className={cx('rounded-2xl border border-line bg-panel shadow-card', className)} {...props}>
      {children}
    </Component>
  )
}
