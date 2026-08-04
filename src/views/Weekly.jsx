import { useState } from 'react'
import Sheet from '../components/Sheet.jsx'
import ReadSheet from '../components/ReadSheet.jsx'
import { useStore } from '../lib/store.jsx'
import { buildWeeklyArticle, preview } from '../lib/format.js'
import {
  chapterOfWeek,
  dayToDate,
  todayStr,
  weekKey,
  weekLabel,
  weekNumber,
  weeksInChapter,
} from '../lib/dates.js'

export default function Weekly() {
  const { meta, weeklyEntries, weeklyFor, saveWeekly, showToast } = useStore()
  const currentWeek = weekNumber(meta.startDate, todayStr())
  const [writing, setWriting] = useState(null) // week number
  const [reading, setReading] = useState(null) // weekly entry
  const [chapter, setChapter] = useState(chapterOfWeek(currentWeek))

  const thisWeek = weeklyFor(weekKey(meta.startDate, currentWeek))
  const maxChapter = chapterOfWeek(currentWeek)

  function checkinsInWeek(n) {
    let count = 0
    for (let i = (n - 1) * 7 + 1; i <= n * 7; i++) {
      if (meta.checkins[dayToDate(meta.startDate, i)]) count++
    }
    return count
  }

  return (
    <>
      <div className="stack">
        <section className="card card-lift card-tint-gold" style={{ padding: '1.4rem 1.35rem' }}>
          <p className="eyebrow" style={{ color: 'var(--gold)' }}>
            {weekLabel(meta.startDate, currentWeek)}
          </p>
          <h1 className="display" style={{ margin: '0.45rem 0 0.4rem' }}>
            {thisWeek ? 'Your week, written' : 'Look back on the week'}
          </h1>
          <p className="muted">
            {checkinsInWeek(currentWeek)} of 7 days written so far.
          </p>
          <div className="row" style={{ marginTop: '1.1rem' }}>
            <button className="btn btn-primary" onClick={() => setWriting(currentWeek)}>
              {thisWeek ? 'Edit this week' : 'Write weekly reflection →'}
            </button>
            {thisWeek && (
              <button className="btn btn-ghost" onClick={() => setReading(thisWeek)}>
                Read it
              </button>
            )}
          </div>
        </section>

        <div className="section-head">
          <h2 className="display">Past reflections</h2>
        </div>
        {weeklyEntries.length === 0 ? (
          <p className="empty">No weekly reflections yet.</p>
        ) : (
          <section className="card">
            {weeklyEntries.map((w) => (
              <button key={w.weekKey} className="list-row" onClick={() => setReading(w)}>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                    {weekLabel(meta.startDate, w.weekNum)}
                  </div>
                  <div className="tiny" style={{ marginTop: 2 }}>
                    {preview(w, 78) || 'No content'}
                  </div>
                </div>
                <span className="tiny">→</span>
              </button>
            ))}
          </section>
        )}

        <div className="section-head">
          <h2 className="display">Chapter {chapter}</h2>
          <div className="row" style={{ gap: '0.35rem', flexWrap: 'nowrap' }}>
            <button
              className="icon-btn"
              disabled={chapter <= 1}
              style={{ opacity: chapter <= 1 ? 0.35 : 1 }}
              onClick={() => setChapter((c) => Math.max(1, c - 1))}
              aria-label="Previous chapter"
            >
              ‹
            </button>
            <button
              className="icon-btn"
              disabled={chapter >= maxChapter}
              style={{ opacity: chapter >= maxChapter ? 0.35 : 1 }}
              onClick={() => setChapter((c) => Math.min(maxChapter, c + 1))}
              aria-label="Next chapter"
            >
              ›
            </button>
          </div>
        </div>
        <section className="card">
          <p className="tiny" style={{ marginBottom: '0.65rem' }}>
            Thirteen weeks — about a season.
          </p>
          <div className="week-grid">
            {weeksInChapter(chapter).map((n) => {
              const key = weekKey(meta.startDate, n)
              const entry = weeklyFor(key)
              const count = checkinsInWeek(n)
              const future = n > currentWeek
              const cls = entry
                ? 'filled'
                : count > 0
                  ? 'partial'
                  : future
                    ? 'future'
                    : ''
              return (
                <button
                  key={n}
                  className={`cell ${cls}${n === currentWeek ? ' today' : ''}`}
                  title={`${weekLabel(meta.startDate, n)} · ${count} days written${
                    entry ? ' · reflection written' : ''
                  }`}
                  onClick={() => {
                    if (entry) setReading(entry)
                    else if (!future) setWriting(n)
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div className="legend">
            <div>
              <span
                className="swatch"
                style={{ background: 'linear-gradient(140deg,var(--iris),var(--jade))' }}
              />
              Reflection written
            </div>
            <div>
              <span className="swatch" style={{ background: 'var(--iris-soft)' }} />
              Some days written
            </div>
            <div>
              <span
                className="swatch"
                style={{ background: 'transparent', boxShadow: '0 0 0 2px var(--ink)' }}
              />
              This week
            </div>
          </div>
        </section>
      </div>

      {writing && (
        <WeeklySheet
          weekNum={writing}
          startDate={meta.startDate}
          questions={meta.weeklyQuestions}
          existing={weeklyFor(weekKey(meta.startDate, writing))}
          onClose={() => setWriting(null)}
          onSave={async (entry) => {
            const ok = await saveWeekly(entry)
            if (ok) {
              showToast('Weekly reflection saved ✓')
              setWriting(null)
            }
          }}
        />
      )}

      {reading && (
        <ReadSheet
          title={`Week ${reading.weekNum}`}
          subtitle={weekLabel(meta.startDate, reading.weekNum)}
          body={reading.article}
          onEdit={() => {
            const n = reading.weekNum
            setReading(null)
            setWriting(n)
          }}
          onClose={() => setReading(null)}
        />
      )}
    </>
  )
}

function WeeklySheet({ weekNum, startDate, questions, existing, onClose, onSave }) {
  const qs = existing?.questionsSnapshot?.length ? existing.questionsSnapshot : questions
  const [answers, setAnswers] = useState(() => qs.map((_, i) => existing?.answers?.[i] || ''))
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    const label = weekLabel(startDate, weekNum)
    await onSave({
      weekKey: weekKey(startDate, weekNum),
      weekNum,
      answers,
      questionsSnapshot: qs,
      article: buildWeeklyArticle({ weekNum, label, questions: qs, answers }),
    })
    setSaving(false)
  }

  return (
    <Sheet
      title={`Week ${weekNum}`}
      subtitle={weekLabel(startDate, weekNum)}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save reflection ✓'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <div className="stack">
        {qs.map((q, i) => (
          <div className="field" key={i}>
            <label className="field-label" htmlFor={`wans-${i}`}>
              {i + 1}. {q}
            </label>
            <textarea
              id={`wans-${i}`}
              className="tall"
              value={answers[i] || ''}
              placeholder="Take your time…"
              onChange={(e) =>
                setAnswers((prev) => {
                  const next = [...prev]
                  next[i] = e.target.value
                  return next
                })
              }
            />
          </div>
        ))}
      </div>
    </Sheet>
  )
}
