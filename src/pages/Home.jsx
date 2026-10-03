import { Link, useNavigate } from 'react-router-dom'
import UsernameForm from '../components/UsernameForm.jsx'
import Card from '../components/ui/Card.jsx'
import { ArrowRightIcon, ClockIcon, CloseIcon, CompareIcon, GaugeIcon, MapPinIcon } from '../components/ui/Icons.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useRecentSearches } from '../hooks/useRecentSearches.js'

const EXAMPLES = [
  { login: 'octocat', note: "GitHub's mascot account" },
  { login: 'gaearon', note: 'React core contributor' },
  { login: 'sindresorhus', note: '1,000+ repos: try Load more' },
  { login: 'unicodeveloper', note: 'Check the recruiter score' },
  { login: 'Ileriayo', note: 'Compare with another profile' },
]

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Kano']

export default function Home() {
  useDocumentTitle()
  const navigate = useNavigate()
  const { recent, remove, clear } = useRecentSearches()

  return (
    <div className="animate-fade-in">
      <section className="mx-auto max-w-2xl pt-4 text-center sm:pt-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold tracking-wide text-accent-ink uppercase">
          <GaugeIcon size={14} /> Recruiter-ready check
        </p>
        <h1 className="mt-4 text-3xl leading-tight font-bold text-balance sm:text-5xl">
          See a GitHub profile the way a recruiter does
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-ink-soft sm:text-lg">
          Look up any developer, browse their work, and get a readiness score with specific tips to improve it.
        </p>
        <UsernameForm
          className="mt-8 text-left"
          label="GitHub username or profile link"
          hideLabel
          autoFocus
          onSubmit={(name) => navigate(`/user/${name}`)}
        />
      </section>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <Card as="section" aria-labelledby="recent-title" className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="recent-title" className="flex items-center gap-2 text-base font-semibold">
              <ClockIcon size={17} className="text-accent" /> Recent searches
            </h2>
            {recent.length > 0 && (
              <button type="button" onClick={clear} className="rounded text-sm font-medium text-ink-soft underline-offset-2 hover:underline">
                Clear all
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">Profiles you open will appear here. They're saved only in this browser.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {recent.map((login) => (
                <li key={login} className="flex items-center rounded-full border border-line bg-panel-2 text-sm">
                  <Link to={`/user/${login}`} className="rounded-full py-1.5 pr-1 pl-3 font-medium text-ink hover:text-primary">
                    {login}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(login)}
                    aria-label={`Remove ${login} from recent searches`}
                    className="mr-1 rounded-full p-1 text-ink-faint hover:bg-panel hover:text-ink"
                  >
                    <CloseIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" aria-labelledby="examples-title" className="p-5">
          <h2 id="examples-title" className="text-base font-semibold">
            Try an example
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {EXAMPLES.map(({ login, note }) => (
              <li key={login}>
                <Link
                  to={`/user/${login}`}
                  className="group flex items-center gap-3 rounded-lg py-2.5 hover:text-primary"
                >
                  <span className="font-semibold text-ink group-hover:text-primary">{login}</span>
                  <span className="truncate text-sm text-ink-faint">{note}</span>
                  <ArrowRightIcon size={16} className="ml-auto shrink-0 text-ink-faint group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card as="section" aria-labelledby="explore-title" className="p-5 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="explore-title" className="flex items-center gap-2 text-base font-semibold">
                <MapPinIcon size={17} className="text-accent" /> Discover developers near you
              </h2>
              <p className="mt-1 text-sm text-ink-soft">Find developers by city, and optionally by language.</p>
            </div>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              <CompareIcon size={16} /> Or compare two profiles
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <li key={city}>
                <Link
                  to={`/explore?location=${encodeURIComponent(city)}`}
                  className="inline-flex h-9 items-center rounded-full border border-line-strong bg-panel px-4 text-sm font-medium text-ink hover:border-primary hover:bg-primary-soft hover:text-primary"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
