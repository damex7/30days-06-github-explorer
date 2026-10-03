# Scout: GitHub Profile Explorer

**Day 6 of my 30-day development challenge**, and the start of the "React + APIs" phase. The focus today is working with a REST API directly: endpoints, query parameters, headers, status codes, pagination and rate limits.

Scout is a GitHub profile viewer that also helps developers improve their profiles:

- **Profile explorer:** search any username to see their details, stats, total stars, a language breakdown and a sortable, filterable repository list with "Load more".
- **Recruiter view:** a 0–100 readiness score from eight explained checks, with a specific tip for every failed one ("4 of your 6 top repos have no description: …").
- **Explore by location:** find developers in Lagos, Abuja, Port Harcourt or any city, optionally filtered by language.
- **Compare:** two profiles side by side, with their scores and a head-to-head table.
- **README preview:** any repo's README, rendered by GitHub and sanitised before display.

Everything that matters is in the URL (`/user/gaearon?tab=repos&sort=forks&lang=JavaScript`, `/explore?location=Lagos&page=2`, `/compare?users=a,b`), so any view can be shared or bookmarked.

## Tech stack

Vite · React 19 · React Router 7 · Tailwind CSS v4 (`@tailwindcss/vite`, tokens in an `@theme` block) · Recharts · DOMPurify.

There's no React Query, SWR or Axios on purpose: every request is a plain `fetch` so the headers and status codes are visible.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the build locally
```

No API key or `.env` file is needed. Deploying to Vercel works out of the box: `vercel.json` rewrites every path to `index.html`, so refreshing `/user/octocat` doesn't 404.

## How the API layer works

Every request goes through one function, `request()` in [`src/lib/github.js`](src/lib/github.js):

1. **Cache:** it checks sessionStorage first. Responses are kept for 5 minutes per URL and `Accept` type.
2. **Headers:** it sends `Accept: application/vnd.github+json` (or `application/vnd.github.html+json` for READMEs) and `X-GitHub-Api-Version: 2022-11-28`. It adds `Authorization: Bearer …` only if the visitor saved their own token.
3. **Rate-limit headers:** it reads `x-ratelimit-remaining`, `-limit`, `-reset` and `-resource` from every response, success or failure.
4. **Status codes:** it turns each status into an error with a `kind` the UI can show properly:

   | Status | Kind | What the user sees |
   |---|---|---|
   | 404 | `not-found` | "No GitHub user called …" |
   | 403 with `remaining: 0`, 429, or `Retry-After` | `rate-limit` | When the limit resets, with a live countdown. Retry unlocks at zero. |
   | 422 | `invalid` | GitHub's reason the search query is invalid |
   | 401 | `bad-token` | A button to fix or remove the saved token |
   | `fetch` rejected | `network` | "Couldn't reach GitHub" with Retry |
   | 5xx | `server` | "GitHub is having trouble" with Retry |

5. **Pagination:** it parses the `Link` header into `{ next, last, prev, first }`. "Load more" follows `rel="next"` until there isn't one. Nothing guesses page numbers: GitHub's own `next` URLs even use a numeric user ID instead of the username.

### Rate limits

GitHub counts requests per IP address when there's no token:

| Bucket | Without a token | With a token |
|---|---|---|
| `core` (users, repos, READMEs) | 60 / hour | 5,000 / hour |
| `search` | 10 / minute | 30 / minute |

The header badge shows the `core` bucket, and the Explore page shows `search`. Both start from `GET /rate_limit`, which is free (it doesn't count against the limit). When the app already knows a bucket is empty, `request()` doesn't send a request it knows will fail.

Ways the app saves requests:

- Repos are fetched 100 per page, the maximum.
- The profile README check needs no request if the repo is already in the loaded list.
- The language chart uses each repo's main language instead of one `/languages` call per repo.
- Search results don't fetch every user's details.
- Usernames are validated before any request is sent.

### Caching trade-off

Responses are cached in **sessionStorage for 5 minutes**. Going back and forth between profiles is free and instant, which matters on a 60-per-hour budget. The cost is that data can be up to 5 minutes old (a new star won't show straight away). sessionStorage is cleared when the tab closes, so stale data never lingers, and if storage fills up the oldest entries are dropped. The cache can never break the app.

### Optional personal token

Click the key icon in the header to paste a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new). Give it access to public repositories only and no permissions.

- It's checked with `/rate_limit` before it's saved.
- It's stored **only in your browser's localStorage** (key `scout-gh-token`). There's no server, and it is never part of this repo or the build.
- It's sent only to `api.github.com`.
- You can remove it from the same dialog, or by clearing the site's data. You can revoke it on GitHub at any time.

### Why DOMPurify?

READMEs come back from GitHub as HTML, and React can only render an HTML string with `dangerouslySetInnerHTML`. A README is written by a stranger. If any script survived into that HTML, it would run on this page and could read the token from localStorage. GitHub already sanitises its output, but DOMPurify adds a second layer: it strips scripts, event handlers, `javascript:` URLs, forms and inline styles. The same pass rewrites relative links and images so they point to the repo.

## The recruiter readiness score

Pure functions in [`src/lib/score.js`](src/lib/score.js). Repo checks look at the six most-starred original repos (no forks or archived repos) and give partial credit.

| Check | Points | Passes when |
|---|---|---|
| Bio | 15 | the bio is filled in |
| Photo | 10 | not GitHub's default identicon (a best guess from the pixels, see below) |
| Location | 5 | a location is set |
| Profile README | 15 | a repo named exactly like the username exists |
| Descriptions | 15 | every top repo has a description |
| Live demos | 10 | at least half of the top repos have a homepage link |
| Licences | 10 | at least half of the top repos have a licence |
| Recent activity | 20 | there was a push in the last 30 days (half points within 90) |

80+ is "Ready to share", 60–79 "Almost there", and below 60 "Needs work".

The API doesn't say whether someone uploaded a photo. [`src/lib/avatar.js`](src/lib/avatar.js) draws the avatar on a canvas and checks for the identicon's pattern: a grey margin, one colour, and a 5×5 grid that's mirror-symmetric. This works because GitHub's avatar server sends CORS headers. If the check can't run, it counts as passed.

## Where each concept lives

| Concept | File |
|---|---|
| Single `request()` function: headers, status codes, errors | [`src/lib/github.js`](src/lib/github.js) |
| Endpoint functions (`getUser`, `getRepos`, `searchUsers`, …) | [`src/lib/github.js`](src/lib/github.js) |
| Query parameters (`per_page`, `sort`, search `q=`) | [`src/lib/github.js`](src/lib/github.js) (`getRepos`, `searchUsers`, `buildUserQuery`) |
| `Link` header pagination | [`src/lib/linkHeader.js`](src/lib/linkHeader.js), [`src/hooks/useRepos.js`](src/hooks/useRepos.js) |
| Rate-limit headers and store | [`src/lib/rateLimit.js`](src/lib/rateLimit.js) |
| Rate-limit badge | [`src/components/RateLimitBadge.jsx`](src/components/RateLimitBadge.jsx) |
| Error states and the reset countdown | [`src/components/ui/ErrorState.jsx`](src/components/ui/ErrorState.jsx), [`src/hooks/useCountdown.js`](src/hooks/useCountdown.js) |
| sessionStorage cache with TTL | [`src/lib/cache.js`](src/lib/cache.js) |
| Optional token in localStorage | [`src/lib/token.js`](src/lib/token.js), [`src/components/SettingsDialog.jsx`](src/components/SettingsDialog.jsx) |
| Loading/error/success with `AbortController` | [`src/hooks/useAsync.js`](src/hooks/useAsync.js) |
| State in the URL | [`src/hooks/useUrlParams.js`](src/hooks/useUrlParams.js) |
| Client-side sorting and filtering | [`src/lib/repos.js`](src/lib/repos.js) |
| Recruiter score (pure functions) | [`src/lib/score.js`](src/lib/score.js) |
| Default-avatar detection | [`src/lib/avatar.js`](src/lib/avatar.js) |
| README sanitising with DOMPurify | [`src/lib/readme.js`](src/lib/readme.js) |
| Language chart (Recharts) | [`src/components/profile/LanguageChart.jsx`](src/components/profile/LanguageChart.jsx), [`src/lib/languages.js`](src/lib/languages.js) |
| Explore by location | [`src/pages/Explore.jsx`](src/pages/Explore.jsx) |
| Compare two profiles | [`src/pages/Compare.jsx`](src/pages/Compare.jsx) |
| Design tokens, light/dark theme | [`src/index.css`](src/index.css), [`index.html`](index.html), [`src/hooks/useTheme.js`](src/hooks/useTheme.js) |
| SPA rewrite for Vercel | [`vercel.json`](vercel.json) |

## Accessibility

- Every page works with the keyboard and has a visible focus ring and a skip link.
- Dialogs use the native `<dialog>` element, so focus is trapped inside and returns to the button that opened them.
- Images have alt text.
- The chart has a title, a one-sentence summary and a "View as table" option.
- The score is always written out in words, never shown by colour alone.
- Changes in result counts are announced politely to screen readers.
- Animations respect reduced-motion settings.
- Layouts work down to 360px wide.
- Chart colours were checked for colour-blind separation in both light and dark mode.

## Ideas for later

- Pinned repositories and the contribution calendar (these need the GraphQL API and a token).
- Exact language percentages by bytes (one extra request per repo).
- ETag conditional requests (`If-None-Match`), so a `304 Not Modified` doesn't count against the limit.
- A recent activity timeline from `/users/{u}/events/public`.
- A shareable "profile report card" image.
- "Sign in with GitHub" through a small backend, so visitors don't paste tokens.
