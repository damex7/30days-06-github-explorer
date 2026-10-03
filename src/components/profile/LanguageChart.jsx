import { useId } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { colorForRank, describeLanguages } from '../../lib/languages.js'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { BookIcon } from '../ui/Icons.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'

/*
  Horizontal bars, one per language, longest first. Bars beat a pie/donut
  here: lengths on a shared baseline are much easier to compare than angles,
  and long language names fit on the axis.

  Accessibility: the SVG is hidden from screen readers (it's just shapes to
  them). The heading names the chart, a sentence summarises it, and
  "View as table" gives the exact numbers.
*/
const ROW_HEIGHT = 34

export default function LanguageChart({ stats, status, basedOn }) {
  const titleId = useId()
  const summaryId = useId()
  const reducedMotion = useReducedMotion()

  return (
    <Card as="figure" aria-labelledby={titleId} aria-describedby={status === 'success' ? summaryId : undefined} className="p-5">
      <h2 id={titleId} className="text-lg font-semibold">
        Languages
      </h2>
      <p className="text-sm text-ink-faint">Main language of each original repo (forks excluded){basedOn && ` · ${basedOn}`}</p>

      {status === 'loading' && (
        <LoadingRegion label="Loading languages" className="mt-4 space-y-3">
          {[90, 70, 50, 30].map((w) => (
            <Skeleton key={w} width={`${w}%`} height="1rem" />
          ))}
        </LoadingRegion>
      )}

      {status === 'error' && (
        <EmptyState compact icon={<BookIcon size={22} />} title="Languages unavailable" message="The repositories couldn't be loaded. Retry from the list below." />
      )}

      {status === 'success' && stats.total === 0 && (
        <EmptyState compact icon={<BookIcon size={22} />} title="No language data" message="None of the loaded original repos has a detected language." />
      )}

      {status === 'success' && stats.total > 0 && (
        <>
          <div aria-hidden="true" className="mt-3 w-full" style={{ height: stats.rows.length * ROW_HEIGHT + 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }} barCategoryGap={8}>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="language"
                  width={96}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-ink-soft)', fontSize: 13 }}
                />
                <Tooltip cursor={{ fill: 'var(--color-panel-2)' }} content={<LanguageTooltip />} isAnimationActive={false} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={!reducedMotion}>
                  {stats.rows.map((row, i) => (
                    <Cell key={row.language} fill={colorForRank(i, row.isOther)} />
                  ))}
                  {/* Value labels in ink, not the bar colour: text always uses text colours */}
                  <LabelList dataKey="count" position="right" fill="var(--color-ink-soft)" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p id={summaryId} className="mt-3 text-sm text-ink-soft">
            {describeLanguages(stats)}
          </p>

          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-primary select-none hover:underline">View as table</summary>
            <table className="mt-2 w-full text-left text-sm">
              <caption className="sr-only">Repositories per main language</caption>
              <thead className="text-xs text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="py-1.5 font-semibold">Language</th>
                  <th scope="col" className="py-1.5 text-right font-semibold">Repos</th>
                  <th scope="col" className="py-1.5 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.rows.map((row) => (
                  <tr key={row.language}>
                    <th scope="row" className="py-1.5 font-medium text-ink">
                      {row.language}
                      {row.isOther && <span className="text-ink-faint"> ({row.members} languages)</span>}
                    </th>
                    <td className="py-1.5 text-right tabular">{row.count}</td>
                    <td className="py-1.5 text-right tabular">{Math.round(row.share * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Card>
  )
}

function LanguageTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm shadow-pop">
      <p className="font-semibold text-ink">{row.language}</p>
      <p className="text-ink-soft">
        {row.count} repo{row.count === 1 ? '' : 's'} · {Math.round(row.share * 100)}%
      </p>
    </div>
  )
}
