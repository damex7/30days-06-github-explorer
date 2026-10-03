import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { cx } from '../../lib/cx.js'
import { Spinner } from '../ui/Button.jsx'
import { CompareIcon, CompassIcon, SearchIcon } from '../ui/Icons.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const NAV = [
  { to: '/', label: 'Search', icon: SearchIcon, end: true },
  { to: '/explore', label: 'Explore', icon: CompassIcon },
  { to: '/compare', label: 'Compare', icon: CompareIcon },
]

/*
  Header + page. On wide screens the nav sits beside the logo; on phones it
  drops to its own row so nothing gets squeezed at 360px.
*/
export default function AppShell({ actions }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 rounded-lg" aria-label="Scout home">
            <Logo />
            <span className="font-display text-lg font-bold tracking-tight">Scout</span>
          </Link>

          <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
            <ul className="flex gap-1">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <li key={to} className="flex-1 sm:flex-none">
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cx(
                        'flex h-9 items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors',
                        isActive ? 'bg-primary-soft text-primary' : 'text-ink-soft hover:bg-panel-2 hover:text-ink',
                      )
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {actions}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8">
        {/* Lazy pages show a spinner here while their code downloads; the header stays put */}
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-faint sm:px-6">
          Data from the public GitHub REST API. Scout is an independent learning project, not affiliated with GitHub.
        </p>
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
      <circle cx="14" cy="14" r="6.5" fill="none" stroke="var(--color-accent)" strokeWidth="3" />
      <path d="M19 19l6 6" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function PageLoading() {
  return (
    <div role="status" className="flex justify-center py-20 text-ink-faint">
      <Spinner className="size-6" />
      <span className="sr-only">Loading page…</span>
    </div>
  )
}
