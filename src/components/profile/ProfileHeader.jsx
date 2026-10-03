import { Link } from 'react-router-dom'
import { formatCompact, formatMonthYear, formatNumber, prettyUrl, toUrl } from '../../lib/format.js'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { BuildingIcon, CalendarIcon, CompareIcon, ExternalIcon, LinkIcon, MapPinIcon } from '../ui/Icons.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'

/** Avatar, name, bio, details and headline numbers. */
export default function ProfileHeader({ user, stars }) {
  const blog = toUrl(user.blog)
  const displayName = user.name || user.login

  return (
    <Card as="section" aria-labelledby="profile-name" className="overflow-hidden">
      {/* A tangerine band at the top: the "report" header */}
      <div className="h-2 bg-accent" />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <img
          src={`${user.avatar_url}&s=192`}
          alt={`Profile photo of ${displayName}`}
          width="96"
          height="96"
          className="size-24 shrink-0 rounded-2xl border border-line bg-panel-2 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="profile-name" className="text-2xl font-bold break-words sm:text-3xl">
                {displayName}
              </h1>
              <p className="font-mono text-sm text-ink-soft">@{user.login}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as={Link} to={`/compare?users=${user.login}`} size="sm" icon={<CompareIcon size={15} />}>
                Compare
              </Button>
              <Button as="a" href={user.html_url} target="_blank" rel="noreferrer" size="sm" icon={<ExternalIcon size={15} />}>
                GitHub<span className="sr-only"> profile (opens in a new tab)</span>
              </Button>
            </div>
          </div>

          {user.bio ? (
            <p className="mt-3 max-w-2xl text-pretty text-ink">{user.bio}</p>
          ) : (
            <p className="mt-3 text-sm text-ink-faint italic">No bio yet.</p>
          )}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            {user.location && (
              <Meta icon={MapPinIcon} label="Location">
                {user.location}
              </Meta>
            )}
            {user.company && (
              <Meta icon={BuildingIcon} label="Company">
                {user.company}
              </Meta>
            )}
            {blog && (
              <Meta icon={LinkIcon} label="Website">
                <a href={blog} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                  {prettyUrl(blog)}
                </a>
              </Meta>
            )}
            {user.twitter_username && (
              <Meta icon={ExternalIcon} label="X (Twitter)">
                <a
                  href={`https://x.com/${user.twitter_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  @{user.twitter_username}
                </a>
              </Meta>
            )}
            <Meta icon={CalendarIcon} label="Joined">
              Joined {formatMonthYear(user.created_at)}
            </Meta>
          </ul>
        </div>
      </div>

      <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
        <Stat label="Followers" value={user.followers} />
        <Stat label="Following" value={user.following} />
        <Stat label="Public repos" value={user.public_repos} />
        <Stat label="Total stars" value={stars.value} note={stars.note} />
      </dl>
    </Card>
  )
}

function Meta({ icon: Icon, label, children }) {
  return (
    <li className="flex min-w-0 items-center gap-1.5">
      <Icon size={16} className="shrink-0 text-ink-faint" />
      <span className="sr-only">{label}: </span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}

function Stat({ label, value, note }) {
  return (
    <div className="border-line px-5 py-4 odd:border-r sm:border-r sm:last:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
      <dt className="text-xs font-semibold tracking-wide text-ink-faint uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular" title={value == null ? undefined : formatNumber(value)}>
        {value == null ? <Skeleton width="3rem" height="1.75rem" /> : formatCompact(value)}
      </dd>
      {note && <dd className="mt-0.5 text-xs text-ink-faint">{note}</dd>}
    </div>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <LoadingRegion label="Loading profile">
      <Card className="overflow-hidden">
        <div className="h-2 bg-panel-2" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
          <Skeleton variant="rect" width="6rem" height="6rem" />
          <div className="flex-1 space-y-3">
            <Skeleton width="40%" height="1.75rem" />
            <Skeleton width="20%" />
            <Skeleton lines={2} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-line p-5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="2.5rem" variant="rect" />
          ))}
        </div>
      </Card>
    </LoadingRegion>
  )
}
