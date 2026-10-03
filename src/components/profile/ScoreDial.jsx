import { cx } from '../../lib/cx.js'

const TONES = {
  success: { stroke: 'var(--color-success)', chip: 'bg-success-soft text-success' },
  warning: { stroke: 'var(--color-warning)', chip: 'bg-warning-soft text-warning' },
  danger: { stroke: 'var(--color-danger)', chip: 'bg-danger-soft text-danger' },
}

/*
  The score as a ring + number + band label. The band is always written
  out in words ("Almost there"), so colour is never the only signal.
*/
export default function ScoreDial({ score, band, size = 148, className }) {
  const stroke = size / 11
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const tone = TONES[band.tone]

  return (
    <div className={cx('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-panel-2)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score / 100)}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold tabular" style={{ fontSize: size / 3.4 }}>
            {score}
          </span>
          <span className="text-xs text-ink-faint">out of 100</span>
        </p>
      </div>
      <p className={cx('mt-3 rounded-full px-3 py-1 text-sm font-semibold', tone.chip)}>{band.label}</p>
    </div>
  )
}
