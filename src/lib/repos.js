/*
  Sorting and filtering happen here, in the browser, on the repos already
  loaded. Why not ask GitHub to sort? The /users/{u}/repos endpoint can only
  sort by created, updated, pushed or full_name, not by stars or forks.
  So "most starred" is only exact once every page is loaded; the UI says so.
*/

export const SORTS = {
  stars: { label: 'Most stars', compare: (a, b) => b.stargazers_count - a.stargazers_count },
  forks: { label: 'Most forks', compare: (a, b) => b.forks_count - a.forks_count },
  updated: { label: 'Recently updated', compare: (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at) },
  name: { label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) },
}
export const DEFAULT_SORT = 'stars'

/** Read filters from URLSearchParams, falling back to safe defaults. */
export function readRepoFilters(params) {
  const sort = params.get('sort')
  return {
    sort: sort in SORTS ? sort : DEFAULT_SORT,
    language: params.get('lang') ?? '',
    hideForks: params.get('forks') === 'hide',
    query: params.get('q') ?? '',
  }
}

export function applyRepoFilters(repos, { sort, language, hideForks, query }) {
  const q = query.trim().toLowerCase()
  return repos
    .filter((r) => !hideForks || !r.fork)
    .filter((r) => !language || (language === '__none' ? !r.language : r.language === language))
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
    .sort((a, b) => SORTS[sort].compare(a, b) || a.name.localeCompare(b.name))
}

/** Languages present in the loaded repos, for the filter dropdown. */
export function languagesIn(repos) {
  return [...new Set(repos.map((r) => r.language).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export const totalStars = (repos) => repos.reduce((sum, r) => sum + r.stargazers_count, 0)

/** Own (non-fork) repos ranked by stars, then most recently pushed. */
export function topRepos(repos, count = 6) {
  return repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, count)
}
