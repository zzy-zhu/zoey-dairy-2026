import { useEffect, useMemo, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import HabitPicker from './HabitPicker.jsx'
import { useStore } from '../lib/store.jsx'
import { buildArticle } from '../lib/format.js'
import { dayNumber, fmtLong, isValidDateStr, todayStr } from '../lib/dates.js'

const TIMER_SECONDS = 10 * 60

/**
 * Writes or edits one day. Old entries keep the prompts they were written
 * against (`questionsSnapshot`), so editing something from months ago doesn't
 * shuffle the answers under a newer set of questions.
 */
export default function EntrySheet({ date, allowDateEdit = false, onClose }) {
  const { meta, entryFor, saveEntry, moveEntry, patchMeta, showToast, newId } = useStore()
  const existing = entryFor(date)

  const questions = useMemo(
    () => (existing?.questionsSnapshot?.length ? existing.questionsSnapshot : meta.questions),
    [existing, meta.questions]
  )
  const habitDefs = meta.habits

  const [answers, setAnswers] = useState(() =>
    questions.map((_, i) => existing?.answers?.[i] || '')
  )
  const [habits, setHabits] = useState(() => existing?.habits || {})
  const [emotion, setEmotion] = useState(existing?.emotion || '')
  const [dateValue, setDateValue] = useState(date)
  const [saving, setSaving] = useState(false)

  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS)
  const [running, setRunning] = useState(false)
  const tick = useRef(null)

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tick.current)
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tick.current)
  }, [running])

  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`

  const n = dayNumber(meta.startDate, date)

  async function save() {
    const target = allowDateEdit ? dateValue.trim() : date
    if (!isValidDateStr(target)) {
      showToast('That date needs to look like 2026-08-04')
      return
    }
    setSaving(true)
    const wrote = answers.some((a) => a.trim())
    const entry = {
      date: target,
      answers,
      habits,
      emotion: emotion.trim(),
      questionsSnapshot: questions,
      article: buildArticle({
        date: target,
        startDate: meta.startDate,
        questions,
        answers,
        habits,
        habitDefs,
        emotion: emotion.trim(),
      }),
    }
    const ok =
      target !== date
        ? await moveEntry(date, entry)
        : await saveEntry(entry, { checkIn: wrote })
    setSaving(false)
    if (ok) {
      showToast(wrote ? 'Saved ✓' : 'Saved')
      onClose()
    }
  }

  return (
    <Sheet
      title={`Day ${n}`}
      subtitle={fmtLong(date)}
      onClose={onClose}
      aside={
        date === todayStr() ? (
          <div className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
            <span className="timer">{clock}</span>
            <button
              className="btn btn-sm"
              onClick={() => {
                if (secondsLeft === 0) setSecondsLeft(TIMER_SECONDS)
                setRunning((r) => !r)
              }}
            >
              {running ? 'Pause' : secondsLeft === TIMER_SECONDS ? 'Start' : 'Resume'}
            </button>
          </div>
        ) : null
      }
      actions={
        <>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save entry ✓'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <div className="stack">
        {allowDateEdit && (
          <div className="field">
            <label className="field-label" htmlFor="entry-date">
              Date <span className="tiny">(YYYY-MM-DD)</span>
            </label>
            <input
              id="entry-date"
              type="text"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              placeholder="2026-08-04"
            />
          </div>
        )}

        <div>
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            Habits
          </div>
          <HabitPicker
            habitDefs={habitDefs}
            values={habits}
            onToggle={(id) => setHabits((prev) => ({ ...prev, [id]: !prev[id] }))}
            onAddHabit={async ({ icon, label }) => {
              const habit = { id: `h-${newId().slice(0, 8)}`, icon, label }
              const ok = await patchMeta({ habits: [...habitDefs, habit] })
              if (ok) {
                setHabits((prev) => ({ ...prev, [habit.id]: true }))
                showToast(`${label} added — it'll be here tomorrow too`)
              }
              return ok
            }}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="entry-feeling">
            How are you feeling? <span className="tiny">one word</span>
          </label>
          <input
            id="entry-feeling"
            type="text"
            maxLength={30}
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            placeholder="hopeful, tired, focused…"
            style={{ maxWidth: 260 }}
          />
        </div>

        <div className="divider" />

        {questions.map((q, i) => (
          <div className="field" key={i}>
            <label className="field-label" htmlFor={`ans-${i}`}>
              {i + 1}. {q}
            </label>
            <textarea
              id={`ans-${i}`}
              value={answers[i] || ''}
              placeholder="Write as much or as little as you like…"
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
