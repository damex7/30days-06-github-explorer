import { useId, useState } from 'react'
import { useCountdown } from '../hooks/useCountdown.js'
import { formatClock, formatNumber } from '../lib/format.js'
import { fetchRateLimit } from '../lib/github.js'
import { useRateLimit } from '../lib/rateLimit.js'
import { TOKEN_KEY, removeToken, saveToken, useHasToken } from '../lib/token.js'
import Button from './ui/Button.jsx'
import { CheckIcon, ExternalIcon, KeyIcon } from './ui/Icons.jsx'
import Modal from './ui/Modal.jsx'

/*
  Optional personal access token. Without one GitHub allows 60 requests
  an hour per IP address; with one, 5,000 an hour for that token.

  The token is checked with GET /rate_limit (free: it doesn't count
  against the limit) BEFORE it's saved, so a typo never gets stored.
*/
const NEW_TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'
const MANAGE_TOKENS_URL = 'https://github.com/settings/personal-access-tokens'

export default function SettingsDialog({ open, onClose }) {
  const hasToken = useHasToken()
  const inputId = useId()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' }) // idle | checking | saved | removed | error

  function close() {
    setValue('')
    setStatus({ state: 'idle', message: '' })
    onClose()
  }

  async function testAndSave(event) {
    event.preventDefault()
    const token = value.trim()
    if (!token) {
      setStatus({ state: 'error', message: 'Paste a token first.' })
      return
    }
    setStatus({ state: 'checking', message: '' })
    try {
      const data = await fetchRateLimit({ token })
      saveToken(token)
      setValue('')
      setStatus({ state: 'saved', message: `Token works. Your limit is now ${formatNumber(data.resources.core.limit)} requests an hour.` })
    } catch (err) {
      setStatus({
        state: 'error',
        message:
          err.kind === 'bad-token'
            ? 'GitHub rejected this token. Check you copied all of it and that it hasn’t expired.'
            : err.message || 'Could not check the token.',
      })
    }
  }

  async function remove() {
    removeToken()
    setStatus({ state: 'removed', message: 'Token removed from this browser. You’re back to 60 requests an hour.' })
    try {
      await fetchRateLimit() // refresh the header numbers for the anonymous limit
    } catch {
      // The badge will update on the next request anyway.
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="GitHub API access"
      description="Optional: use your own token for a higher rate limit."
      footer={<Button onClick={close}>Done</Button>}
    >
      <div className="space-y-5">
        <Usage hasToken={hasToken} />

        <form onSubmit={testAndSave} className="space-y-2" noValidate>
          <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
            {hasToken ? 'Replace your token' : 'Personal access token'}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="github_pat_…"
              autoComplete="off"
              spellCheck="false"
              aria-describedby={`${inputId}-status`}
              className="h-10 min-w-0 flex-1 rounded-xl border border-line-strong bg-panel px-3 font-mono text-sm text-ink placeholder:text-ink-faint"
            />
            <Button type="submit" variant="primary" loading={status.state === 'checking'} icon={<KeyIcon size={15} />}>
              Test &amp; save
            </Button>
          </div>
          <p id={`${inputId}-status`} role="status" className="min-h-5 text-sm">
            {status.state === 'error' && <span className="font-medium text-danger">{status.message}</span>}
            {(status.state === 'saved' || status.state === 'removed') && (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <CheckIcon size={15} /> {status.message}
              </span>
            )}
          </p>
        </form>

        {hasToken && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
            <p className="text-sm text-ink">A token is saved in this browser.</p>
            <Button variant="danger" size="sm" onClick={remove}>
              Remove token
            </Button>
          </div>
        )}

        <section aria-labelledby="where-title" className="rounded-xl bg-panel-2 p-4">
          <h3 id="where-title" className="font-sans text-sm font-semibold text-ink">
            Where your token is kept
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Only in <strong className="text-ink">this browser’s localStorage</strong>, under the key{' '}
              <code className="rounded bg-panel px-1 font-mono text-xs text-ink">{TOKEN_KEY}</code>. Scout has no server and no
              database.
            </li>
            <li>It is sent only to api.github.com, in the Authorization header, and never to any other site.</li>
            <li>
              To remove it: use <em>Remove token</em> above, or clear this site’s data in your browser settings. Revoke it completely
              at{' '}
              <a href={MANAGE_TOKENS_URL} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                GitHub token settings
              </a>
              .
            </li>
            <li>Don’t save a token on a shared or public computer.</li>
          </ul>
        </section>

        <section aria-labelledby="how-title">
          <h3 id="how-title" className="font-sans text-sm font-semibold text-ink">
            How to create one (2 minutes)
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Open{' '}
              <a href={NEW_TOKEN_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline">
                New fine-grained token <ExternalIcon size={13} />
              </a>
              .
            </li>
            <li>Give it a name like “Scout” and a short expiry (e.g. 7 days).</li>
            <li>
              Under repository access choose <strong className="text-ink">Public repositories</strong>. Add no permissions: Scout only
              reads public data.
            </li>
            <li>Generate it, copy it, and paste it above.</li>
          </ol>
        </section>
      </div>
    </Modal>
  )
}

function Usage({ hasToken }) {
  const core = useRateLimit('core')
  const search = useRateLimit('search')
  return (
    <div className="grid grid-cols-2 gap-3">
      <Bucket title="Profiles & repos" info={core} fallbackLimit={hasToken ? 5000 : 60} period="hour" />
      <Bucket title="Search" info={search} fallbackLimit={hasToken ? 30 : 10} period="minute" />
    </div>
  )
}

function Bucket({ title, info, fallbackLimit, period }) {
  const left = useCountdown(info?.remaining === 0 ? info.reset : null)
  const remaining = info?.remaining
  const limit = info?.limit ?? fallbackLimit
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs font-semibold text-ink-faint uppercase">{title}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink tabular">
        {remaining === undefined ? '—' : formatNumber(remaining)}
        <span className="text-sm font-medium text-ink-faint"> / {formatNumber(limit)}</span>
      </p>
      <p className="text-xs text-ink-faint">
        left this {period}
        {info?.reset && ` · resets ${formatClock(info.reset)}`}
        {left > 0 && ` (${Math.ceil(left / 60)} min)`}
      </p>
    </div>
  )
}
