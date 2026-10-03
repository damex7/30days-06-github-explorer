import { useId, useState } from 'react'
import { cx } from '../lib/cx.js'
import { cleanUsername, validateUsername } from '../lib/username.js'
import Button from './ui/Button.jsx'
import { SearchIcon } from './ui/Icons.jsx'

/*
  A labelled username input with validation. Used on Home and Compare.
  Errors are linked to the input with aria-describedby so screen readers
  read them when focus returns to the field.
*/
export default function UsernameForm({
  onSubmit,
  label = 'GitHub username',
  hideLabel = false,
  defaultValue = '',
  buttonLabel = 'Scout',
  size = 'lg',
  autoFocus = false,
  className,
}) {
  const id = useId()
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const name = cleanUsername(value)
    const problem = validateUsername(name)
    setError(problem)
    if (problem) {
      event.currentTarget.elements.username.focus()
      return
    }
    onSubmit(name)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <label htmlFor={id} className={cx('mb-1.5 block text-sm font-semibold text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint">
            <SearchIcon size={size === 'lg' ? 20 : 17} />
          </span>
          <input
            id={id}
            name="username"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            autoFocus={autoFocus}
            placeholder="e.g. octocat"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError('')
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cx(
              'w-full rounded-full border bg-panel pr-4 text-ink placeholder:text-ink-faint',
              size === 'lg' ? 'h-14 pl-12 text-lg' : 'h-10 pl-10 text-sm',
              error ? 'border-danger' : 'border-line-strong',
            )}
          />
        </div>
        <Button type="submit" variant="primary" size={size === 'lg' ? 'lg' : 'md'} className={size === 'lg' ? 'h-14 px-6' : ''}>
          {buttonLabel}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
