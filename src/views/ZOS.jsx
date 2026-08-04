import { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Countdown, { Clock } from '../components/Countdown.jsx'
import EntrySheet from '../components/EntrySheet.jsx'
import ReadSheet from '../components/ReadSheet.jsx'
import WeekStory from '../components/WeekStory.jsx'
import { MemoBoard } from '../components/MemoBoard.jsx'
import { streakLine, streakStats } from '../lib/streak.js'
import { goalAccent } from '../lib/story.js'
import { preview } from '../lib/format.js'
import {
  addDays,
  dayNumber,
  diffDays,
  fmtLong,
  fmtShort,
  isValidDateStr,
  todayStr,
  weekKey,
  weekNumber,
} from '../lib/dates.js'

/**
 * The console: one screen that answers "where am I?" — today's state, the
 * chain of days, what's counting down, and the logs underneath it all.
 */
export default function ZOS({ go }) {
  const { meta, entries, goals, memos, weeklyFor, prioritiesFor } = useStore()
  const today = todayStr()

  const [writing, setWriting] = useState(false)
  const [reading, setReading] = useState(null)
  const [story, setStory] = useState(null)

  const streak = useMemo(() => streakStats(meta.checkins, today), [meta.checkins, today])
  const dayN = dayNumber(meta.startDate, today)
  const weekN = weekNumber(meta.startDate, today)
  const weekDone = !!weeklyFor(weekKey(meta.startDate, weekN))

  // This week's memos, for the pattern panel.
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, -i)),
    [today]
  )
  const weekMemos = useMemo(
    () => memos.filter((m) => weekDates.includes(m.date)),
    [memos, weekDates]
  )

  const priorities = prioritiesFor(today)
  const prioritiesDone = priorities.filter((p) => p.done).length

  const activeGoals = goals.filter((g) => !g.archived && !g.doneAt)
  const deadlines = activeGoals
    .filter((g) => g.targetDate && isValidDateStr(g.targetDate))
    .map((g) => ({ goal: g, days: diffDays(today, g.targetDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)

  const recent = entries.slice(0, 5)

  return (
    <>
      <div className="stack">
        <header className="os-bar">
          <div>
            <span className="os-name">zOS</span>
            <span className="os-version">v2</span>
          </div>
          <div className="os-bar-right">
            <span className="tiny">{fmtLong(today)}</span>
            <Clock />
          </div>
        </header>

        {/* Status + countdown */}
        <section className={`card card-lift os-status${streak.todayDone ? ' done' : ''}`}>
          <div className="os-status-main">
            <p className="eyebrow">Day {dayN} · Week {weekN}</p>
            <h1 className="display" style={{ margin: '0.3rem 0 0.2rem' }}>
              {streak.todayDone ? "Today's logged" : 'Today is open'}
            </h1>
            <p className="muted">{streakLine(streak)}</p>
            <div className="row" style={{ marginTop: '0.9rem' }}>
              <button className="btn btn-primary" onClick={() => setWriting(true)}>
                {streak.todayDone ? "Open today's log" : 'Write today →'}
              </button>
              <button className="btn btn-accent" onClick={() => setStory(weekN)}>
                ▸ Play the week
              </button>
            </div>
          </div>
          <Countdown
            label={streak.todayDone ? 'Day ends in' : 'Time left to log today'}
            calm={streak.todayDone}
          />
        </section>

      </div>

      <div className="os-grid">
        {/* ── Wide column ───────────────────────────────────────────────── */}
        <div className="stack">
        {/* Streak */}
        <section className="card">
          <div className="row-between" style={{ marginBottom: '0.7rem' }}>
            <h2 className="display" style={{ fontSize: '1.35rem' }}>
              The chain
            </h2>
            {streak.alive ? (
              <span className="badge badge-jade">alive</span>
            ) : (
              <span className="badge badge-quiet">lapsed</span>
            )}
          </div>

          <div className="os-metrics">
            <div>
              <span className="os-metric">{streak.current}</span>
              <span className="stat-l">Current</span>
            </div>
            <div>
              <span className="os-metric">{streak.best}</span>
              <span className="stat-l">Longest</span>
            </div>
            <div>
              <span className="os-metric">{streak.total}</span>
              <span className="stat-l">Days total</span>
            </div>
            <div>
              <span className="os-metric">{streak.consistency}%</span>
              <span className="stat-l">Kept up</span>
            </div>
          </div>

          <div className="ribbon" role="img" aria-label="Last 28 days">
            {streak.ribbon.map((d) => (
              <i
                key={d.date}
                className={`${d.done ? 'on' : ''}${d.isToday ? ' now' : ''}`}
                title={`${fmtShort(d.date)}${d.done ? ' · written' : ''}`}
              />
            ))}
          </div>
          <p className="tiny" style={{ marginTop: '0.45rem' }}>
            Last 28 days · {streak.last7} of the last 7 · {streak.last30Rate}% of the month
          </p>
        </section>

        {/* Memo pattern */}
        <section className="card">
          <div className="row-between" style={{ marginBottom: '0.6rem' }}>
            <h2 className="display" style={{ fontSize: '1.35rem' }}>
              This week's notes
            </h2>
            <span className="tiny">{weekMemos.length} pinned</span>
          </div>
          <MemoBoard
            memos={weekMemos.slice(0, 6)}
            small
            showPattern
            empty="No notes pinned this week yet."
          />
          <button
            className="btn btn-ghost btn-sm"
            style={{ paddingLeft: 0, marginTop: '0.5rem' }}
            onClick={() => go('today')}
          >
            Pin one in Today →
          </button>
        </section>

        </div>

        {/* ── Narrow column ─────────────────────────────────────────────── */}
        <div className="stack">
        {/* Today's priorities at a glance */}
        {priorities.length > 0 && (
          <section className="card">
            <div className="row-between" style={{ marginBottom: '0.5rem' }}>
              <h2 className="display" style={{ fontSize: '1.35rem' }}>
                Today's priorities
              </h2>
              <span className={`badge${prioritiesDone === priorities.length ? ' badge-jade' : ' badge-quiet'}`}>
                {prioritiesDone}/{priorities.length}
              </span>
            </div>
            {priorities.map((p) => {
              const goal = goals.find((g) => g.id === p.goalId)
              return (
                <div className="os-line" key={p.id}>
                  <i className={`os-tick${p.done ? ' on' : ''}`} />
                  <span className={p.done ? 'os-line-done' : ''}>{p.text}</span>
                  {goal && (
                    <i className="goal-dot" style={{ background: goalAccent(goal.id) }} />
                  )}
                </div>
              )
            })}
            <button
              className="btn btn-ghost btn-sm"
              style={{ paddingLeft: 0, marginTop: '0.4rem' }}
              onClick={() => go('today')}
            >
              Edit in Today →
            </button>
          </section>
        )}

        {/* Countdowns to goal dates */}
        {deadlines.length > 0 && (
          <section className="card">
            <h2 className="display" style={{ fontSize: '1.35rem', marginBottom: '0.6rem' }}>
              Counting down
            </h2>
            {deadlines.map(({ goal, days }) => (
              <button key={goal.id} className="os-line os-line-btn" onClick={() => go('goals')}>
                <i className="goal-dot" style={{ background: goalAccent(goal.id) }} />
                <span>{goal.title}</span>
                <span className={`os-days${days < 7 ? ' urgent' : ''}`}>
                  {days > 0 ? `${days}d` : days === 0 ? 'today' : `${Math.abs(days)}d past`}
                </span>
              </button>
            ))}
          </section>
        )}

        {/* Weekly state */}
        <section className="card">
          <div className="row-between">
            <div>
              <h2 className="display" style={{ fontSize: '1.35rem' }}>
                Week {weekN}
              </h2>
              <p className="tiny" style={{ marginTop: 2 }}>
                {weekDone ? 'Reflection written' : 'Reflection not written yet'}
              </p>
            </div>
            <button className="btn btn-sm" onClick={() => go('weekly')}>
              {weekDone ? 'Read it' : 'Write it'}
            </button>
          </div>
        </section>

        </div>
      </div>

      <div className="stack">
        {/* Recent logs */}
        <div className="section-head">
          <h2 className="display">Recent logs</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => go('journal')}>
            All {entries.length} →
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="empty">Nothing logged yet.</p>
        ) : (
          <section className="card">
            {recent.map((e) => (
              <button key={e.date} className="list-row" onClick={() => setReading(e)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    Day {dayNumber(meta.startDate, e.date)} · {fmtShort(e.date)}
                  </div>
                  <div className="tiny" style={{ marginTop: 2 }}>
                    {preview(e, 72) || 'Habits and mood only'}
                  </div>
                </div>
                {e.emotion && <span className="badge badge-quiet">{e.emotion}</span>}
              </button>
            ))}
          </section>
        )}

        <p className="tiny" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          {streak.first
            ? `Writing since ${fmtShort(streak.first)} · ${streak.total} entries on file`
            : 'No entries on file yet'}
        </p>
      </div>

      {writing && <EntrySheet date={today} onClose={() => setWriting(false)} />}
      {story && <WeekStory weekNum={story} onClose={() => setStory(null)} />}
      {reading && (
        <ReadSheet
          title={`Day ${dayNumber(meta.startDate, reading.date)}`}
          subtitle={fmtLong(reading.date)}
          body={reading.article}
          onClose={() => setReading(null)}
        />
      )}
    </>
  )
}
