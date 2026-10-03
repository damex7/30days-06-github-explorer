const LOCALE = 'en-GB'

const compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat(LOCALE)

/** 1234 → "1.2K" (with the exact number available via formatNumber). */
export const formatCompact = (n) => compact.format(n ?? 0)
export const formatNumber = (n) => full.format(n ?? 0)

const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' })
const fullDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const clock = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })

export const formatMonthYear = (iso) => monthYear.format(new Date(iso))
export const formatDate = (iso) => fullDate.format(new Date(iso))
export const formatClock = (ms) => clock.format(new Date(ms))

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "3 days ago", "last month", "just now". */
export function timeAgo(iso, now = Date.now()) {
  const seconds = (new Date(iso).getTime() - now) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

/** 754 → "12:34", 4000 → "1:06:40". For countdowns. */
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Say "12 minutes 5 seconds" for screen readers rather than "12:05". */
export function spokenDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  const parts = []
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`)
  if (s || !m) parts.push(`${s} second${s === 1 ? '' : 's'}`)
  return parts.join(' ')
}

export const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`

/** Blog fields often lack a protocol: "example.com" → "https://example.com". */
export function toUrl(value) {
  if (!value) return null
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    return new URL(url).href
  } catch {
    return null
  }
}

/** "https://www.example.com/" → "example.com" for display. */
export const prettyUrl = (url) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
