import { DEFAULT_TTL, readCache, writeCache } from './cache.js'
import { parseLinkHeader } from './linkHeader.js'
import { getRateLimit, recordRateLimit, recordRateLimitBody } from './rateLimit.js'
import { getToken } from './token.js'

/*
  Every GitHub request in the app goes through request() in this file.
  Components never call fetch() themselves, so headers, errors, caching and
  rate limits are handled in exactly one place.
*/

export const API = 'https://api.github.com'
const API_VERSION = '2022-11-28'
const JSON_TYPE = 'application/vnd.github+json'
const HTML_TYPE = 'application/vnd.github.html+json'

/** An error with a `kind` the UI can switch on, instead of raw status codes. */
export class GitHubError extends Error {
  constructor(kind, message, { status = null, resetAt = null } = {}) {
    super(message)
    this.name = 'GitHubError'
    this.kind = kind // 'not-found' | 'rate-limit' | 'invalid' | 'bad-token' | 'forbidden' | 'network' | 'server'
    this.status = status
    this.resetAt = resetAt // ms timestamp, for rate limits
  }
}

/**
 * Fetch a GitHub API path (or a full URL from a Link header).
 * Returns { data, links } where links = { next, last, prev, first }.
 */
export async function request(pathOrUrl, { accept = JSON_TYPE, signal, cache = true, ttl = DEFAULT_TTL, token } = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : API + pathOrUrl
  // Safety: the token must only ever travel to GitHub's API.
  if (!url.startsWith(API + '/')) throw new Error(`Refusing to request a non-GitHub URL: ${url}`)

  // 1. Cache. Same URL + same Accept = same answer for a few minutes.
  const cacheKey = `${accept} ${url}`
  if (cache) {
    const hit = readCache(cacheKey, ttl)
    if (hit) return { data: hit.data, links: parseLinkHeader(hit.link), fromCache: true }
  }

  // 2. Already out of requests? Don't waste a call we know will fail.
  const bucket = getRateLimit(url.startsWith(`${API}/search/`) ? 'search' : 'core')
  if (bucket && bucket.remaining === 0 && bucket.reset > Date.now()) {
    throw rateLimitError(bucket.reset, bucket.limit)
  }

  // 3. Headers.
  //    Accept: which representation we want (JSON, or rendered HTML for READMEs).
  //    X-GitHub-Api-Version: pins the API version, so GitHub changes can't break us.
  //    Authorization: only when the visitor saved their own token.
  const headers = { Accept: accept, 'X-GitHub-Api-Version': API_VERSION }
  const authToken = token ?? getToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let res
  try {
    res = await fetch(url, { headers, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err // we cancelled it: not a real error
    // fetch only rejects when no HTTP response arrived at all: offline, DNS, CORS.
    throw new GitHubError('network', "Couldn't reach GitHub. Check your internet connection and try again.")
  }

  // 4. Rate-limit headers come on every response, success or failure.
  recordRateLimit(res.headers)

  // 5. Status codes. fetch does NOT throw on 404 or 500; we must check res.ok.
  if (!res.ok) throw await errorFromResponse(res)

  const data = accept === HTML_TYPE ? await res.text() : await res.json()
  const link = res.headers.get('link')
  if (cache) writeCache(cacheKey, { data, link })
  return { data, links: parseLinkHeader(link), fromCache: false }
}

async function errorFromResponse(res) {
  let message = ''
  let body = null
  try {
    body = await res.json()
    message = body?.message ?? ''
  } catch {
    // Some errors have no JSON body.
  }
  const remaining = res.headers.get('x-ratelimit-remaining')
  const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000
  const retryAfter = Number(res.headers.get('retry-after'))

  switch (res.status) {
    case 401:
      return new GitHubError('bad-token', 'GitHub rejected the saved token. It may be expired or mistyped.', { status: 401 })
    case 404:
      return new GitHubError('not-found', 'Not found on GitHub.', { status: 404 })
    case 422: {
      // "Unprocessable": GitHub understood the request but the query is invalid.
      const detail = body?.errors?.[0]?.message
      return new GitHubError('invalid', detail || message || 'GitHub could not process that search.', { status: 422 })
    }
    case 403:
    case 429:
      // Primary limit: remaining hits 0, reset says when it refills.
      if (remaining === '0') return rateLimitError(reset, Number(res.headers.get('x-ratelimit-limit')))
      // Secondary limit (too many requests too fast): Retry-After in seconds.
      if (retryAfter) return rateLimitError(Date.now() + retryAfter * 1000)
      if (res.status === 429 || /rate limit/i.test(message)) return rateLimitError(reset || Date.now() + 60_000)
      return new GitHubError('forbidden', message || 'GitHub refused this request.', { status: 403 })
    default:
      return new GitHubError(
        'server',
        res.status >= 500 ? 'GitHub is having trouble right now. Try again in a moment.' : message || `Request failed (${res.status}).`,
        { status: res.status },
      )
  }
}

function rateLimitError(resetAt, limit) {
  const message =
    limit && limit <= 60
      ? `You've used all ${limit} requests GitHub allows. Add a free personal token to raise the limit, or wait for it to reset.`
      : "You've hit GitHub's rate limit. It resets soon."
  return new GitHubError('rate-limit', message, { status: 403, resetAt })
}

/* ---------- Endpoints ---------- */

const enc = encodeURIComponent

/** GET /users/{username}: profile, counts and links. */
export async function getUser(username, opts) {
  return (await request(`/users/${enc(username)}`, opts)).data
}

/**
 * GET /users/{username}/repos: first page of public repos.
 * type=owner includes forks they own; sort=updated puts active work first.
 * per_page=100 is the maximum, so most users need just one request.
 * Follow `links.next` with getNextPage for more.
 */
export function getRepos(username, opts) {
  return request(`/users/${enc(username)}/repos?type=owner&sort=updated&per_page=100`, opts)
}

/** Fetch the URL from a Link header (rel="next"). */
export function getNextPage(url, opts) {
  return request(url, opts)
}

/** GET /repos/{owner}/{repo}: used to check for a profile README repo. */
export async function getRepo(owner, repo, opts) {
  return (await request(`/repos/${enc(owner)}/${enc(repo)}`, opts)).data
}

/** Does github.com/{username}/{username} exist? 404 simply means "no". */
export async function hasProfileReadmeRepo(username, opts) {
  try {
    await getRepo(username, username, opts)
    return true
  } catch (err) {
    if (err.kind === 'not-found') return false
    throw err
  }
}

/**
 * GET /repos/{owner}/{repo}/readme with the HTML media type: GitHub renders
 * the Markdown for us and returns an HTML string. Must be sanitised before
 * display (see lib/readme.js).
 */
export async function getReadmeHtml(owner, repo, opts) {
  return (await request(`/repos/${enc(owner)}/${enc(repo)}/readme`, { ...opts, accept: HTML_TYPE })).data
}

export const SEARCH_PER_PAGE = 24

/** Build the search q= string. Quotes let locations with spaces work. */
export function buildUserQuery({ location, language }) {
  const clean = (s) => s.replace(/"/g, '').trim()
  const parts = ['type:user']
  if (location?.trim()) parts.push(`location:"${clean(location)}"`)
  if (language?.trim()) parts.push(`language:"${clean(language)}"`)
  return parts.join(' ')
}

/**
 * GET /search/users: developers matching location/language, most-followed first.
 * Returns { data: { total_count, items }, links }. The search API only ever
 * serves the first 1,000 results, however large total_count is.
 */
export function searchUsers({ location, language, page = 1 }, opts) {
  const params = new URLSearchParams({
    q: buildUserQuery({ location, language }),
    sort: 'followers',
    order: 'desc',
    per_page: String(SEARCH_PER_PAGE),
    page: String(page),
  })
  return request(`/search/users?${params}`, opts)
}

/**
 * GET /rate_limit: current numbers for every bucket. Calling it does not
 * count against the limit, so it's safe to call on startup. Never cached.
 */
export async function fetchRateLimit(opts) {
  const { data } = await request('/rate_limit', { ...opts, cache: false })
  recordRateLimitBody(data)
  return data
}
