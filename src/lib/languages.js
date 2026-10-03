/*
  Language breakdown from the repo list.

  Each repo object has one `language` (its main language, by bytes).
  Counting repos per language costs zero extra requests. The precise
  alternative, GET /repos/{owner}/{repo}/languages, returns bytes per
  language but costs one request PER REPO, far too many on a 60/hour limit.
*/

export const MAX_SLICES = 6 // matches --color-chart-1..6

/** [{ language, count, share }] sorted by count, with small ones folded into "Other". */
export function languageStats(repos, { maxSlices = MAX_SLICES } = {}) {
  const counts = new Map()
  let total = 0
  for (const repo of repos) {
    if (repo.fork || !repo.language) continue
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
    total++
  }
  const sorted = [...counts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language))

  let rows = sorted
  if (sorted.length > maxSlices) {
    const kept = sorted.slice(0, maxSlices - 1)
    const otherCount = sorted.slice(maxSlices - 1).reduce((sum, r) => sum + r.count, 0)
    rows = [...kept, { language: 'Other', count: otherCount, isOther: true, members: sorted.length - kept.length }]
  }
  return { total, rows: rows.map((r) => ({ ...r, share: total ? r.count / total : 0 })) }
}

/** CSS colour for the language at this rank; same colour in the chart and the repo list. */
export function colorForRank(index, isOther = false) {
  if (isOther || index < 0 || index >= MAX_SLICES) return 'var(--color-chart-muted)'
  return `var(--color-chart-${index + 1})`
}

/** language name → colour, using the profile's own ranking. */
export function languageColorMap(stats) {
  const map = new Map()
  stats.rows.forEach((row, i) => {
    if (!row.isOther) map.set(row.language, colorForRank(i))
  })
  return map
}

/** One sentence describing the chart, for its caption and screen readers. */
export function describeLanguages(stats) {
  if (!stats.total) return 'No language data: none of the loaded repositories have a detected language.'
  const [top, second] = stats.rows
  const pct = (r) => `${Math.round(r.share * 100)}%`
  let text = `${top.language} is the main language in ${top.count} of ${stats.total} repositories (${pct(top)}).`
  if (second) text += ` Next is ${second.language} with ${second.count} (${pct(second)}).`
  return text
}
