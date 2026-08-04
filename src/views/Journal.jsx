import { useMemo, useState } from 'react'
import ReadSheet from '../components/ReadSheet.jsx'
import EntrySheet from '../components/EntrySheet.jsx'
import { useStore } from '../lib/store.jsx'
import { preview } from '../lib/format.js'
import { streakStats } from '../lib/streak.js'
import {
  dayNumber,
  fmtLong,
  fmtShort,
  monthGrid,
  monthLabel,
  parseLocalDate,
  todayStr,
} from '../lib/dates.js'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Journal() {
  const { meta, entries, entryFor, exportAll } = useStore()
  const today = todayStr()
  const now = parseLocalDate(today)

  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [reading, setReading] = useState(null)
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')

  const totalWritten = Object.keys(meta.checkins).length
  const streak = streakStats(meta.checkins, today).current
  const words = useMemo(
    () =>
      entries.reduce(
        (sum, e) => sum + (e.article ? e.article.trim().split(/\s+/).filter(Boolean).length : 0),
        0
      ),
    [entries]
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter(
      (e) =>
        (e.article || '').toLowerCase().includes(needle) ||
        (e.emotion || '').toLowerCase().includes(needle) ||
        e.date.includes(needle)
    )
  }, [entries, q])

  const cells = monthGrid(cursor.year, cursor.month)
  const atCurrentMonth =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth()

  function shiftMonth(delta) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <>
      <div className="stack">
        <section className="stats">
          <div className="stat">
            <div className="stat-n">{totalWritten}</div>
            <div className="stat-l">Days written</div>
          </div>
          <div className="stat">
            <div className="stat-n">{streak}</div>
            <div className="stat-l">Streak</div>
          </div>
          <div className="stat">
            <div className="stat-n">{words > 999 ? `${Math.round(words / 1000)}k` : words}</div>
            <div className="stat-l">Words</div>
          </div>
        </section>

        <section className="card">
          <div className="row-between" style={{ marginBottom: '0.85rem' }}>
            <h2 className="display" style={{ fontSize: '1.05rem' }}>
              {monthLabel(cursor.year, cursor.month)}
            </h2>
            <div className="row" style={{ gap: '0.35rem', flexWrap: 'nowrap' }}>
              <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                ‹
              </button>
              <button
                className="icon-btn"
                onClick={() => shiftMonth(1)}
                disabled={atCurrentMonth}
                style={{ opacity: atCurrentMonth ? 0.35 : 1 }}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          <div className="cal" style={{ marginBottom: '0.35rem' }}>
            {WEEKDAYS.map((d, i) => (
              <div className="cal-head" key={i}>
                {d}
              </div>
            ))}
          </div>
          <div className="cal">
            {cells.map((date, i) => {
              if (!date) return <div className="cell empty" key={`e${i}`} />
              const written = !!meta.checkins[date]
              const future = date > today
              return (
                <button
                  key={date}
                  className={`cell${written ? ' filled' : ''}${date === today ? ' today' : ''}${
                    future ? ' future' : ''
                  }`}
                  disabled={future}
                  title={`${fmtShort(date)}${written ? ' · written' : ''}`}
                  onClick={() => {
                    const e = entryFor(date)
                    if (e) setReading(e)
                    else if (!future) setEditing(date)
                  }}
                >
                  {parseLocalDate(date).getDate()}
                </button>
              )
            })}
          </div>
          <div className="legend">
            <div>
              <span className="swatch" style={{ background: 'var(--blue)' }} />
              Written
            </div>
            <div>
              <span className="swatch" style={{ background: 'var(--yellow)' }} />
              Today
            </div>
            <div>Tap an empty day to write it in.</div>
          </div>
        </section>

        <div className="section-head">
          <h2 className="display">Every entry</h2>
          <span className="tiny">{entries.length} saved</span>
        </div>

        <input
          type="text"
          value={q}
          placeholder="Search your entries…"
          onChange={(e) => setQ(e.target.value)}
        />

        {filtered.length === 0 ? (
          <p className="empty">
            {q ? 'Nothing matches that.' : 'No entries yet — today is a good place to start.'}
          </p>
        ) : (
          <section className="card">
            {filtered.map((e) => (
              <button key={e.date} className="list-row" onClick={() => setReading(e)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                    Day {dayNumber(meta.startDate, e.date)} · {fmtShort(e.date)}
                  </div>
                  <div className="tiny" style={{ marginTop: 2 }}>
                    {preview(e, 76) || 'Habits and mood only'}
                  </div>
                </div>
                {e.emotion ? (
                  <span className="badge badge-quiet">{e.emotion}</span>
                ) : (
                  <span className="tiny">→</span>
                )}
              </button>
            ))}
          </section>
        )}

        <section className="card">
          <h3 className="display" style={{ marginBottom: '0.4rem' }}>
            Your archive
          </h3>
          <p className="muted" style={{ marginBottom: '0.9rem' }}>
            Everything — entries, weekly reflections, goals, priorities — as one JSON file you
            keep.
          </p>
          <button className="btn" onClick={exportAll}>
            ↓ Download everything
          </button>
        </section>
      </div>

      {reading && (
        <ReadSheet
          title={`Day ${dayNumber(meta.startDate, reading.date)}`}
          subtitle={fmtLong(reading.date)}
          body={reading.article}
          onEdit={() => {
            const d = reading.date
            setReading(null)
            setEditing(d)
          }}
          onClose={() => setReading(null)}
        />
      )}

      {editing && (
        <EntrySheet date={editing} allowDateEdit onClose={() => setEditing(null)} />
      )}
    </>
  )
}
