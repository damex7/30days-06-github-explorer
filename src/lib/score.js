import { timeAgo } from './format.js'
import { topRepos } from './repos.js'

/*
  Recruiter readiness score: 0–100, built from eight explained checks.

  Everything here is a PURE function: data in, result out. No fetching,
  no React, no Date.now() hidden inside (the caller passes `now`). That
  makes the scoring easy to read, reuse on the Compare page, and test.

  Each check returns:
    { id, label, points, earned, passed, detail, tip }
  - points: the most it can add to the score (all checks sum to 100)
  - earned: what this profile gets; ratio checks give partial credit
  - detail: what we found ("4 of 6 top repos have a description")
  - tip: a specific next step, only shown when the check isn't passed
*/

export const TOP_REPO_COUNT = 6
const DAY = 24 * 60 * 60 * 1000

export const WEIGHTS = {
  bio: 15,
  photo: 10,
  location: 5,
  profileReadme: 15,
  descriptions: 15,
  demos: 10,
  licences: 10,
  activity: 20,
}

const list = (names) => {
  const shown = names.slice(0, 3).map((n) => `“${n}”`)
  return names.length > 3 ? `${shown.join(', ')} and ${names.length - 3} more` : shown.join(', ').replace(/, ([^,]*)$/, ' and $1')
}

function binary(id, label, passed, { detail, tip }) {
  const points = WEIGHTS[id]
  return { id, label, points, earned: passed ? points : 0, passed, detail, tip }
}

/**
 * Partial-credit check over the top repos. `threshold` is the share needed
 * to pass (and to earn full points): 1 = every top repo, 0.5 = half of them.
 */
function ratio(id, label, top, has, threshold, describe) {
  const points = WEIGHTS[id]
  const n = top.length
  const withIt = top.filter(has)
  const without = top.filter((r) => !has(r))
  const share = n ? withIt.length / n : 0
  const passed = n > 0 && share >= threshold
  return {
    id,
    label,
    points,
    earned: Math.round(points * Math.min(1, share / threshold)),
    passed,
    ...describe({ n, have: withIt.length, missing: without.map((r) => r.name) }),
  }
}

export function checkBio(user) {
  return binary('bio', 'Has a bio', Boolean(user.bio?.trim()), {
    detail: user.bio?.trim() ? 'Bio is filled in.' : 'No bio on the profile.',
    tip: "Add a one-line bio saying what you build and what you're looking for, e.g. “Frontend developer in Lagos · React & Node · open to remote roles”.",
  })
}

/** hasCustomAvatar: true / false, or null when it couldn't be checked. */
export function checkPhoto(hasCustomAvatar) {
  const unknown = hasCustomAvatar === null || hasCustomAvatar === undefined
  return binary('photo', 'Has a profile photo', unknown || hasCustomAvatar, {
    detail: unknown
      ? "Couldn't check the photo automatically, so this one counts as passed."
      : hasCustomAvatar
        ? 'Uses an uploaded photo or image (best guess from the pixels).'
        : "Still using GitHub's default pattern avatar (best guess from the pixels).",
    tip: 'Upload a clear photo or personal avatar in GitHub Settings → Public profile. The default pattern makes an account look unused.',
  })
}

export function checkLocation(user) {
  return binary('location', 'Shows a location', Boolean(user.location?.trim()), {
    detail: user.location?.trim() ? `Location: ${user.location.trim()}.` : 'No location set.',
    tip: 'Add your city (e.g. “Abuja, Nigeria”). Recruiters filter by location, and it puts you in location searches like the Explore page.',
  })
}

/** hasReadme: true / false. A repo named exactly like the username shows its README on the profile. */
export function checkProfileReadme(user, hasReadme) {
  return binary('profileReadme', 'Has a profile README', Boolean(hasReadme), {
    detail: hasReadme ? `Found the special “${user.login}/${user.login}” repository.` : `No “${user.login}/${user.login}” repository.`,
    tip: `Create a public repository named “${user.login}” and add a README.md. GitHub pins it to the top of your profile: introduce yourself, your stack and your best projects.`,
  })
}

export function checkDescriptions(top) {
  return ratio('descriptions', 'Top repos have descriptions', top, (r) => Boolean(r.description?.trim()), 1, ({ n, have, missing }) => ({
    detail: n ? `${have} of ${n} top repos have a description.` : 'No original public repos yet.',
    tip: n
      ? `${missing.length} of your ${n} top repos ${missing.length === 1 ? 'has' : 'have'} no description: ${list(missing)}. One sentence on what it does and the stack is enough (repo page → About → ⚙).`
      : 'Publish a project of your own (not a fork) with a short description, so there is something to show.',
  }))
}

export function checkDemos(top) {
  return ratio('demos', 'Live demo links', top, (r) => Boolean(r.homepage?.trim()), 0.5, ({ n, have }) => ({
    detail: n ? `${have} of ${n} top repos link a live demo.` : 'No original public repos yet.',
    tip: n
      ? `${have === 0 ? 'None' : `Only ${have}`} of your ${n} top repos link${have === 1 ? 's' : ''} a live demo. Deploy them (Vercel, Netlify, GitHub Pages) and paste the URL into About → Website. Aim for at least half.`
      : 'Deploy a project and add its URL to the repo’s Website field. A clickable demo gets far more attention than code alone.',
  }))
}

export function checkLicences(top) {
  return ratio('licences', 'Licences on top repos', top, (r) => Boolean(r.license), 0.5, ({ n, missing }) => ({
    detail: n ? `${n - missing.length} of ${n} top repos have a licence.` : 'No original public repos yet.',
    tip: n
      ? `${missing.length} of your ${n} top repos ${missing.length === 1 ? 'has' : 'have'} no licence: ${list(missing)}. Add one with “Add file → Create new file → LICENSE” and pick a template (MIT is common).`
      : 'When you publish a project, add a LICENSE file so others know how they may use it.',
  }))
}

/** Full points for a push in the last 30 days, half within 90, none after. */
export function checkActivity(repos, now) {
  const points = WEIGHTS.activity
  const own = repos.filter((r) => !r.fork)
  const latest = own.reduce((max, r) => (r.pushed_at > max ? r.pushed_at : max), '')
  const age = latest ? (now - new Date(latest).getTime()) / DAY : Infinity
  const earned = age <= 30 ? points : age <= 90 ? points / 2 : 0
  return {
    id: 'activity',
    label: 'Recent activity',
    points,
    earned,
    passed: age <= 30,
    detail: latest ? `Last push to an own repo: ${timeAgo(latest, now)}.` : 'No pushes to original repos found.',
    tip: latest
      ? `Your last push was ${timeAgo(latest, now)}. Recruiters look for recent work: commit to a project at least every few weeks, even small improvements.`
      : 'Push some code to a repo of your own. Recent activity is the strongest signal that a profile is alive.',
  }
}

export function scoreBand(score) {
  if (score >= 80) return { id: 'ready', label: 'Ready to share', tone: 'success' }
  if (score >= 60) return { id: 'almost', label: 'Almost there', tone: 'warning' }
  return { id: 'needs-work', label: 'Needs work', tone: 'danger' }
}

/**
 * The whole report.
 * @param user           GET /users/{u} body
 * @param repos          loaded repos (page 1 is sorted by last update, so it includes the latest push)
 * @param hasProfileReadme  boolean
 * @param hasCustomAvatar   boolean | null
 * @param now            timestamp, passed in to keep this function pure
 */
export function scoreProfile({ user, repos, hasProfileReadme, hasCustomAvatar, now }) {
  const top = topRepos(repos, TOP_REPO_COUNT)
  const checks = [
    checkBio(user),
    checkPhoto(hasCustomAvatar),
    checkLocation(user),
    checkProfileReadme(user, hasProfileReadme),
    checkDescriptions(top),
    checkDemos(top),
    checkLicences(top),
    checkActivity(repos, now),
  ]
  const score = Math.round(checks.reduce((sum, c) => sum + c.earned, 0))
  return { score, band: scoreBand(score), checks, top, passedCount: checks.filter((c) => c.passed).length }
}
