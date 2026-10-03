import { Link } from 'react-router-dom'
import { formatCompact, prettyUrl, timeAgo, toUrl } from '../../lib/format.js'
import { BookIcon, ExternalIcon, ForkIcon, StarIcon } from '../ui/Icons.jsx'

/** One repository. `readmeTo` is a link that opens the README preview. */
export default function RepoCard({ repo, color, readmeTo }) {
  const demo = toUrl(repo.homepage)
  return (
    <li className="flex flex-col rounded-2xl border border-line bg-panel p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 font-display text-base font-semibold break-words">
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
            {repo.name}
            <span className="sr-only"> (opens on GitHub in a new tab)</span>
          </a>
        </h3>
        {repo.fork && <Tag>Fork</Tag>}
        {repo.archived && <Tag>Archived</Tag>}
      </div>

      {repo.description ? (
        <p className="mt-1.5 line-clamp-3 text-sm text-pretty text-ink-soft">{repo.description}</p>
      ) : (
        <p className="mt-1.5 text-sm text-ink-faint italic">No description</p>
      )}

      {repo.topics?.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Topics">
          {repo.topics.slice(0, 4).map((t) => (
            <li key={t} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          {repo.language && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: color ?? 'var(--color-chart-muted)' }} />
              {repo.language}
            </li>
          )}
          <li className="flex items-center gap-1" title={`${repo.stargazers_count} stars`}>
            <StarIcon size={14} />
            <span className="tabular">{formatCompact(repo.stargazers_count)}</span>
            <span className="sr-only">stars</span>
          </li>
          <li className="flex items-center gap-1" title={`${repo.forks_count} forks`}>
            <ForkIcon size={14} />
            <span className="tabular">{formatCompact(repo.forks_count)}</span>
            <span className="sr-only">forks</span>
          </li>
          {repo.license && <li>{repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : 'Licence'}</li>}
          <li>Updated {timeAgo(repo.pushed_at)}</li>
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          {readmeTo && (
            <Link
              to={readmeTo}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold text-ink hover:bg-panel-2"
            >
              <BookIcon size={14} /> README<span className="sr-only"> for {repo.name}</span>
            </Link>
          )}
          {demo && (
            <a
              href={demo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-semibold text-accent-ink hover:brightness-95"
              title={prettyUrl(demo)}
            >
              <ExternalIcon size={14} /> Live demo<span className="sr-only"> of {repo.name} (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

function Tag({ children }) {
  return <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs font-medium text-ink-soft">{children}</span>
}
