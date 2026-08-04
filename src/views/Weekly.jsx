import { useState } from 'react'
import Sheet from '../components/Sheet.jsx'
import ReadSheet from '../components/ReadSheet.jsx'
import WeekStory from '../components/WeekStory.jsx'
import { MemoBoard } from '../components/MemoBoard.jsx'
import { useStore } from '../lib/store.jsx'
import { buildWeeklyArticle, preview } from '../lib/format.js'
import { memosToText } from '../lib/memos.js'
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
  const { meta, weeklyEntries, weeklyFor, saveWeekly, memos, showToast } = useStore()
  const currentWeek = weekNumber(meta.startDate, todayStr())
  const [writing, setWriting] = useState(null) // week number
  const [reading, setReading] = useState(null) // weekly entry
  const [story, setStory] = useState(null) // week number
  const [chapter, setChapter] = useState(chapterOfWeek(currentWeek))

  const thisWeek = weeklyFor(weekKey(meta.startDate, currentWeek))
  const maxChapter = chapterOfWeek(currentWeek)

  /** Notes pinned inside a given week — the raw material for its pattern. */
  function memosInWeek(n) {
    const dates = []
    for (let i = (n - 1) * 7 + 1; i <= n * 7; i++) {
      dates.push(dayToDate(meta.startDate, i))
    }
    return memos.filter((m) => dates.includes(m.date))
  }

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
            <button className="btn btn-accent" onClick={() => setStory(currentWeek)}>
              ▸ Play your week
            </button>
            <button className="btn" onClick={() => setWriting(currentWeek)}>
              {thisWeek ? 'Edit reflection' : 'Write reflection'}
            </button>
            {thisWeek && (
              <button className="btn btn-ghost" onClick={() => setReading(thisWeek)}>
                Read it
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <div className="row-between" style={{ marginBottom: '0.6rem' }}>
            <h2 className="display" style={{ fontSize: '1.35rem' }}>
              This week's notes
            </h2>
            <span className="tiny">{memosInWeek(currentWeek).length} pinned</span>
          </div>
          <MemoBoard
            memos={memosInWeek(currentWeek)}
            small
            showPattern
            empty="Nothing pinned this week yet — notes live in Today."
          />
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
            Thirteen weeks — about a season. Tap any week to play it back.
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
                  disabled={future}
                  onClick={() => {
                    if (!future) setStory(n)
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div className="legend">
            <div>
              <span className="swatch" style={{ background: 'var(--blue)' }} />
              Reflection written
            </div>
            <div>
              <span className="swatch" style={{ background: 'var(--blue-soft)' }} />
              Some days written
            </div>
            <div>
              <span className="swatch" style={{ background: 'var(--yellow)' }} />
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
          memos={memosInWeek(writing)}
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

      {story && <WeekStory weekNum={story} onClose={() => setStory(null)} />}

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

function WeeklySheet({ weekNum, startDate, questions, memos, existing, onClose, onSave }) {
  const qs = existing?.questionsSnapshot?.length ? existing.questionsSnapshot : questions
  const [answers, setAnswers] = useState(() => qs.map((_, i) => existing?.answers?.[i] || ''))
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    const label = weekLabel(startDate, weekNum)
    // The week's pinned notes are folded into the summary itself, so the
    // pattern is part of the record rather than a separate view.
    const notes = memosToText(memos)
    await onSave({
      weekKey: weekKey(startDate, weekNum),
      weekNum,
      answers,
      questionsSnapshot: qs,
      memoCount: memos.length,
      article: buildWeeklyArticle({ weekNum, label, questions: qs, answers }) + (notes ? '\n' + notes : ''),
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
        {memos.length > 0 && (
          <section className="card card-tint-gold">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
              Your notes this week — saved with this summary
            </p>
            <MemoBoard memos={memos} small showPattern />
          </section>
        )}

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
