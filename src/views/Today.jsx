import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import EntrySheet from '../components/EntrySheet.jsx'
import HabitPicker from '../components/HabitPicker.jsx'
import InspoSheet from '../components/InspoSheet.jsx'
import WeekStory from '../components/WeekStory.jsx'
import { SparkCapture, SparkRow } from '../components/Sparks.jsx'
import { MemoBoard, MemoComposer } from '../components/MemoBoard.jsx'
import { buildArticle } from '../lib/format.js'
import { goalAccent } from '../lib/story.js'
import { streakStats } from '../lib/streak.js'
import { resolveQuestions, sparkForDate } from '../lib/prompts.js'
import {
  dayNumber,
  fmtLong,
  greeting,
  todayStr,
  weekKey,
  weekNumber,
} from '../lib/dates.js'

const MAX_PRIORITIES = 5

export default function Today({ go }) {
  const {
    user,
    meta,
    goals,
    entries,
    inspo,
    memosFor,
    deleteMemo,
    entryFor,
    weeklyFor,
    prioritiesFor,
    setPriorities,
    saveEntry,
    patchMeta,
    saveInspo,
    deleteInspo,
    showToast,
    newId,
  } = useStore()

  const today = todayStr()
  const entry = entryFor(today)
  const [writing, setWriting] = useState(false)
  const [story, setStory] = useState(null)
  const [openInspo, setOpenInspo] = useState(null)
  const [sparking, setSparking] = useState(false)

  const dayN = dayNumber(meta.startDate, today)
  const streak = streakStats(meta.checkins, today).current
  const written = !!meta.checkins[today]

  const weekN = weekNumber(meta.startDate, today)
  const weekDone = !!weeklyFor(weekKey(meta.startDate, weekN))
  const isSunday = new Date().getDay() === 0

  const firstName = (user?.displayName || '').split(' ')[0]
  const activeGoals = goals.filter((g) => !g.archived && !g.doneAt)
  const todaysSparks = inspo.filter((d) => d.date === today)
  const todaysMemos = memosFor(today)

  async function spark() {
    setSparking(true)
    try {
      const { generateInspo } = await import('../lib/insights.js')
      const recent = entries
        .slice(0, 6)
        .map((e) => e.article)
        .filter(Boolean)
        .join('\n\n---\n\n')
      const result = await generateInspo({
        goals: activeGoals,
        recent,
        priorities: prioritiesFor(today).filter((p) => !p.done),
      })
      const saved = await saveInspo({ ...result, kind: 'page', date: today, goalId: null })
      if (saved) setOpenInspo(saved)
    } catch (e) {
      showToast(e.message || 'Could not write that')
    } finally {
      setSparking(false)
    }
  }

  return (
    <>
      <div className="stack">
        <section className="card card-lift card-tint-iris" style={{ padding: '1.5rem 1.35rem' }}>
          <p className="eyebrow">{fmtLong(today)}</p>
          <h1 className="display" style={{ margin: '0.5rem 0 0.35rem' }}>
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="muted">
            Day {dayN} of writing
            {streak > 1 ? ` · ${streak} days in a row` : ''}
          </p>
          <div className="row" style={{ marginTop: '1.15rem' }}>
            <button className="btn btn-primary" onClick={() => setWriting(true)}>
              {written ? 'Open today’s entry' : entry ? 'Continue writing' : 'Write today →'}
            </button>
            {written && <span className="badge badge-gold">written</span>}
          </div>
        </section>

        {isSunday && (
          <section className="card card-lift story-teaser">
            <div className="story-teaser-glow" aria-hidden="true" />
            <p className="eyebrow" style={{ color: 'var(--iris)' }}>
              Sunday · Week {weekN}
            </p>
            <h2 className="display" style={{ margin: '0.4rem 0 0.35rem' }}>
              Your week in review is ready
            </h2>
            <p className="muted">
              Seven days, tap by tap. Takes about a minute.
            </p>
            <div className="row" style={{ marginTop: '1.05rem' }}>
              <button className="btn btn-accent" onClick={() => setStory(weekN)}>
                ▸ Play your week
              </button>
              {!weekDone && (
                <button className="btn btn-ghost" onClick={() => go('weekly')}>
                  Write the reflection
                </button>
              )}
            </div>
          </section>
        )}

        {!isSunday && new Date().getDay() === 6 && !weekDone && (
          <button className="card card-tint-gold" onClick={() => go('weekly')}>
            <div className="row-between">
              <div>
                <p className="eyebrow" style={{ color: 'var(--gold)' }}>
                  Week {weekN}
                </p>
                <p style={{ fontSize: '0.92rem', marginTop: 4 }}>
                  Saturday — a good time to look back on the week.
                </p>
              </div>
              <span style={{ color: 'var(--gold)' }}>→</span>
            </div>
          </button>
        )}

        <Priorities
          key={today}
          initial={prioritiesFor(today)}
          goals={activeGoals}
          onSave={(items) => setPriorities(today, items)}
          newId={newId}
        />

        <QuickHabits
          date={today}
          entry={entry}
          habitDefs={meta.habits}
          questions={meta.questions}
          startDate={meta.startDate}
          saveEntry={saveEntry}
          patchMeta={patchMeta}
          showToast={showToast}
          newId={newId}
        />

        <section className="card">
          <div className="row-between" style={{ marginBottom: '0.5rem' }}>
            <h2 className="display" style={{ fontSize: '1.35rem' }}>
              Today's notes
            </h2>
            <span className="tiny">{todaysMemos.length} pinned</span>
          </div>
          <p className="tiny" style={{ marginBottom: '0.7rem' }}>
            Quick memos in whatever shape suits them — what you did, how you felt, what the day
            was like. The mix becomes this week's pattern.
          </p>
          <MemoBoard memos={todaysMemos} onDelete={deleteMemo} />
          <div style={{ marginTop: todaysMemos.length ? '0.7rem' : 0 }}>
            <MemoComposer date={today} />
          </div>
        </section>

        <section className="card">
          <div className="row-between" style={{ marginBottom: '0.5rem' }}>
            <h2 className="display" style={{ fontSize: '1.35rem' }}>
              Inspiration
            </h2>
            {inspo.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => go('insights')}>
                all {inspo.length} →
              </button>
            )}
          </div>
          <p className="tiny" style={{ marginBottom: '0.6rem' }}>
            Write it down while you have it. Every one keeps its date and time, and can be tied to
            a goal.
          </p>

          <SparkCapture goals={activeGoals} />

          {todaysSparks.length > 0 && (
            <>
              <div className="divider" />
              <p className="eyebrow" style={{ marginBottom: '0.3rem' }}>
                Today
              </p>
              {todaysSparks.map((s) => (
                <SparkRow
                  key={s.id}
                  spark={s}
                  goals={goals}
                  onOpen={setOpenInspo}
                  onDelete={deleteInspo}
                />
              ))}
            </>
          )}

          <div className="divider" />
          <div className="row">
            <button className="btn btn-sm" onClick={spark} disabled={sparking}>
              {sparking ? 'Writing…' : '✦ Or have Claude write me a page'}
            </button>
          </div>
        </section>

        {activeGoals.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="display">What you're working toward</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => go('goals')}>
                All goals →
              </button>
            </div>
            {activeGoals.slice(0, 2).map((g) => {
              const done = (g.milestones || []).filter((m) => m.done).length
              const total = (g.milestones || []).length
              const pct = total ? Math.round((done / total) * 100) : 0
              return (
                <button key={g.id} className="card" onClick={() => go('goals')}>
                  <div className="row-between" style={{ marginBottom: '0.6rem' }}>
                    <span className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
                      <i className="goal-dot" style={{ background: goalAccent(g.id) }} />
                      <strong style={{ fontSize: '0.94rem' }}>{g.title}</strong>
                    </span>
                    <span className="tiny">{pct}%</span>
                  </div>
                  <div className="meter">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  {total > 0 && (
                    <p className="tiny" style={{ marginTop: '0.5rem' }}>
                      {done} of {total} milestones
                    </p>
                  )}
                </button>
              )
            })}
          </>
        )}

        <div className="section-head">
          <h2 className="display">Today's prompts</h2>
          <span className="tiny">{meta.questions.length} questions</span>
        </div>
        <section className="card spark-card" style={{ marginBottom: '0.9rem' }}>
          <p className="eyebrow">Today's spark</p>
          <p className="spark-line">{sparkForDate(today)}</p>
          <p className="tiny">A line to write from, if you want one. New one tomorrow.</p>
        </section>
        <section className="card">
          {meta.questions.map((q, i) => (
            <div
              key={i}
              className="row"
              style={{
                gap: '0.6rem',
                alignItems: 'flex-start',
                padding: '0.45rem 0',
                borderBottom:
                  i === meta.questions.length - 1 ? 'none' : '1px solid var(--hairline)',
              }}
            >
              <span className="rank">{i + 1}</span>
              <span className="muted" style={{ flex: 1 }}>
                {q}
              </span>
            </div>
          ))}
        </section>
      </div>

      {writing && <EntrySheet date={today} onClose={() => setWriting(false)} />}
      {story && <WeekStory weekNum={story} onClose={() => setStory(null)} />}
      {openInspo && (
        <InspoSheet
          doc={openInspo}
          onClose={() => setOpenInspo(null)}
          onDelete={deleteInspo}
        />
      )}
    </>
  )
}

/**
 * Up to five things that matter today, each optionally pinned to a goal so the
 * week's story can show where the effort actually went. Seeded once from the
 * loaded day and keyed by date, so an in-flight save never overwrites what
 * you're mid-way through typing.
 */
function Priorities({ initial, goals, onSave, newId }) {
  const [local, setLocal] = useState(initial)
  const timer = useRef(null)

  function commit(next, immediate = false) {
    setLocal(next)
    clearTimeout(timer.current)
    const flush = () => {
      timer.current = null
      onSave(next.filter((p) => p.text.trim()))
    }
    if (immediate) flush()
    else timer.current = setTimeout(flush, 700)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const done = local.filter((p) => p.done && p.text.trim()).length
  const total = local.filter((p) => p.text.trim()).length

  return (
    <section className="card">
      <div className="row-between" style={{ marginBottom: '0.5rem' }}>
        <h2 className="display" style={{ fontSize: '1.05rem' }}>
          Today's priorities
        </h2>
        {total > 0 && (
          <span className={`badge${done === total ? ' badge-jade' : ' badge-quiet'}`}>
            {done}/{total}
          </span>
        )}
      </div>

      {local.length === 0 && (
        <p className="tiny" style={{ marginBottom: '0.5rem' }}>
          Name the one to three things that would make today feel worthwhile — and tie them to a
          goal if they belong to one.
        </p>
      )}

      {local.map((p) => {
        const goal = goals.find((g) => g.id === p.goalId) || null
        return (
          <div className={`priority${p.done ? ' done' : ''}`} key={p.id}>
            <button
              className={`tick${p.done ? ' on' : ''}`}
              aria-label={p.done ? 'Mark unfinished' : 'Mark done'}
              onClick={() =>
                commit(
                  local.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)),
                  true
                )
              }
            >
              ✓
            </button>
            <input
              className="priority-text"
              value={p.text}
              placeholder="Something that matters today…"
              onChange={(e) =>
                commit(local.map((x) => (x.id === p.id ? { ...x, text: e.target.value } : x)))
              }
              onBlur={() => commit(local.filter((x) => x.text.trim() || x.id === p.id), true)}
            />
            <button
              className="icon-btn"
              style={{ width: 26, height: 26, fontSize: '0.75rem' }}
              aria-label="Remove"
              onClick={() => commit(local.filter((x) => x.id !== p.id), true)}
            >
              ✕
            </button>

            {goals.length > 0 && (
              <label className="priority-goal">
                <i
                  className="goal-dot"
                  style={{ background: goal ? goalAccent(goal.id) : 'var(--hairline-strong)' }}
                />
                <select
                  className={`goal-select${goal ? ' linked' : ''}`}
                  value={p.goalId || ''}
                  aria-label="Link to a goal"
                  onChange={(e) =>
                    commit(
                      local.map((x) =>
                        x.id === p.id ? { ...x, goalId: e.target.value || null } : x
                      ),
                      true
                    )
                  }
                >
                  <option value="">no goal</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )
      })}

      {local.length < MAX_PRIORITIES && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: '0.6rem', paddingLeft: 0 }}
          onClick={() => commit([...local, { id: newId(), text: '', done: false, goalId: null }])}
        >
          + Add a priority
        </button>
      )}
    </section>
  )
}

/**
 * Habit ticks and the one-word mood, editable without opening the writing
 * sheet. These save into the day's entry but never mark the day as written.
 */
function QuickHabits({
  date,
  entry,
  habitDefs,
  questions,
  startDate,
  saveEntry,
  patchMeta,
  showToast,
  newId,
}) {
  const habits = entry?.habits || {}
  const [emotion, setEmotion] = useState(entry?.emotion || '')
  const lastSaved = useRef(entry?.emotion || '')

  useEffect(() => {
    setEmotion(entry?.emotion || '')
    lastSaved.current = entry?.emotion || ''
  }, [entry?.emotion, date])

  function persist(nextHabits, nextEmotion) {
    // Resolve against the entry itself so a day written under the old
    // seven-prompt set keeps all of its answers.
    const qs = resolveQuestions(entry, questions)
    const answers = qs.map((_, i) => entry?.answers?.[i] || '')
    const wrote = answers.some((a) => a.trim())
    saveEntry(
      {
        ...entry,
        date,
        answers,
        habits: nextHabits,
        emotion: nextEmotion.trim(),
        questionsSnapshot: qs,
        article: buildArticle({
          date,
          startDate,
          questions: qs,
          answers,
          habits: nextHabits,
          habitDefs,
          emotion: nextEmotion.trim(),
        }),
      },
      { checkIn: wrote }
    )
  }

  /**
   * A habit added here joins the standing list, so it's waiting to be ticked
   * tomorrow and every day after. It starts ticked for today, since you're
   * usually adding it because you just did it.
   */
  async function addHabit({ icon, label }) {
    const habit = { id: `h-${newId().slice(0, 8)}`, icon, label }
    const ok = await patchMeta({ habits: [...habitDefs, habit] })
    if (ok) {
      persist({ ...habits, [habit.id]: true }, emotion)
      showToast(`${label} added — it'll be here tomorrow too`)
    }
    return ok
  }

  return (
    <section className="card">
      <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>
        Today's habits
      </div>
      <HabitPicker
        habitDefs={habitDefs}
        values={habits}
        onToggle={(id) => persist({ ...habits, [id]: !habits[id] }, emotion)}
        onAddHabit={addHabit}
      />
      <div className="divider" />
      <div className="field">
        <label className="field-label" htmlFor="quick-feeling">
          Feeling <span className="tiny">one word</span>
        </label>
        <input
          id="quick-feeling"
          type="text"
          maxLength={30}
          value={emotion}
          placeholder="hopeful, tired, focused…"
          style={{ maxWidth: 260 }}
          onChange={(e) => setEmotion(e.target.value)}
          onBlur={() => {
            if (emotion.trim() !== lastSaved.current.trim()) {
              lastSaved.current = emotion
              persist(habits, emotion)
            }
          }}
        />
      </div>
    </section>
  )
}
