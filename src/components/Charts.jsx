import { useState } from 'react'
import { KINDS, memoPattern, patternSentence } from '../lib/memos.js'
import { fmtShort, parseLocalDate } from '../lib/dates.js'

/**
 * Small dashboard charts. Marks are thin, one hue per single-series chart, and
 * every value that carries identity is labelled as well as coloured — the
 * post-it pastels are too pale to separate as chart fills, so charts use the
 * validated deeper step of the same hue (see --chart-* in styles.css).
 */

/** Part-of-whole for one number. A ring plus the figure inside it. */
export function Ring({ value, label, size = 76 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="ring-wrap">
      <div
        className="ring"
        style={{ '--pct': pct, width: size, height: size }}
        role="img"
        aria-label={`${label}: ${pct} percent`}
      >
        <span>{pct}%</span>
      </div>
      <span className="stat-l">{label}</span>
    </div>
  )
}

/**
 * Words written per day. One series, so one hue and no legend — the panel
 * title names it. The busiest day gets a direct label; the rest are on hover.
 */
export function DayBars({ days, unit = 'words' }) {
  const [tip, setTip] = useState(null)
  const max = Math.max(1, ...days.map((d) => d.value))
  const busiest = days.reduce((a, b) => (b.value > a.value ? b : a), days[0] || {})

  return (
    <div className="chart">
      <div className="bars" onMouseLeave={() => setTip(null)}>
        {days.map((d, i) => {
          const h = d.value ? Math.max(4, Math.round((d.value / max) * 100)) : 0
          return (
            <button
              key={d.date}
              className={`bar-slot${tip?.date === d.date ? ' hot' : ''}`}
              onMouseEnter={() =>
                setTip({ ...d, side: i > days.length / 2 ? 'right' : 'left' })
              }
              onFocus={() => setTip({ ...d, side: i > days.length / 2 ? 'right' : 'left' })}
              onClick={() => setTip({ ...d, side: i > days.length / 2 ? 'right' : 'left' })}
              aria-label={`${fmtShort(d.date)}: ${d.value} ${unit}`}
            >
              <i style={{ height: `${h}%` }} className={d.value ? '' : 'bar-none'} />
            </button>
          )
        })}
      </div>

      <div className="chart-foot">
        <span className="tiny">{fmtShort(days[0]?.date || '')}</span>
        {busiest?.value > 0 && (
          <span className="tiny chart-note">
            busiest: {dayName(busiest.date)} · {busiest.value} {unit}
          </span>
        )}
        <span className="tiny">today</span>
      </div>

      {tip && (
        <div className={`chart-tip ${tip.side}`}>
          <strong>{tip.value}</strong> {unit}
          <span>{fmtShort(tip.date)}</span>
        </div>
      )}
    </div>
  )
}

const dayName = (d) => parseLocalDate(d).toLocaleDateString('en-US', { weekday: 'short' })

/** Habit consistency this week: one bar each, out of seven, all labelled. */
export function HabitBars({ habits, outOf = 7 }) {
  if (!habits.length) return null
  return (
    <div className="hbars">
      {habits.map((h) => (
        <div className="hbar" key={h.id} title={`${h.label}: ${h.count} of ${outOf} days`}>
          <span className="hbar-label">
            <span aria-hidden="true">{h.icon}</span> {h.label}
          </span>
          <span className="hbar-track">
            <i style={{ width: `${(h.count / outOf) * 100}%` }} />
          </span>
          <span className="hbar-value">
            {h.count}/{outOf}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * The week's mix of note kinds as one stacked bar, with a labelled legend —
 * three segments never carry meaning by colour alone.
 */
export function PatternBar({ memos }) {
  const pattern = memoPattern(memos)
  if (!pattern.total) return null

  return (
    <div className="pattern">
      <div className="pattern-bar" role="img" aria-label={patternSentence(pattern)}>
        {KINDS.map((k) =>
          pattern.counts[k.id] ? (
            <i
              key={k.id}
              style={{
                width: `${(pattern.counts[k.id] / pattern.total) * 100}%`,
                background: k.chart,
              }}
            />
          ) : null
        )}
      </div>
      <div className="pattern-legend">
        {KINDS.map((k) => (
          <span key={k.id} className={pattern.counts[k.id] ? '' : 'off'}>
            <i style={{ background: k.chart }} aria-hidden="true" />
            {k.label}
            <strong>{pattern.counts[k.id]}</strong>
          </span>
        ))}
      </div>
      <p className="tiny">{patternSentence(pattern)}</p>
    </div>
  )
}
