import { useMemo, useState } from 'react'
import Sheet from '../components/Sheet.jsx'
import { useStore } from '../lib/store.jsx'
import { goalAccent } from '../lib/story.js'
import { addDays, fmtShort, isValidDateStr, todayStr, diffDays } from '../lib/dates.js'

const HORIZONS = [
  { id: 'season', label: 'This season', days: 90 },
  { id: 'month', label: 'This month', days: 30 },
  { id: 'year', label: 'This year', days: 365 },
  { id: 'someday', label: 'Someday', days: null },
]

export default function Goals() {
  const { goals, days, inspo, saveGoal, deleteGoal, showToast, newId } = useStore()
  const [editing, setEditing] = useState(null) // goal object or 'new'
  const [showArchived, setShowArchived] = useState(false)

  // Priorities from the last seven days, grouped by the goal they were tied to.
  const recentWork = useMemo(() => {
    const window = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), -i))
    const tally = {}
    window.forEach((d) => {
      ;(days[d]?.priorities || []).forEach((p) => {
        if (!p.goalId) return
        const t = (tally[p.goalId] ||= { total: 0, done: 0 })
        t.total++
        if (p.done) t.done++
      })
    })
    return tally
  }, [days])

  const active = goals.filter((g) => !g.archived && !g.doneAt)
  const done = goals.filter((g) => !g.archived && g.doneAt)
  const archived = goals.filter((g) => g.archived)

  function toggleMilestone(goal, id) {
    saveGoal({
      ...goal,
      milestones: (goal.milestones || []).map((m) =>
        m.id === id ? { ...m, done: !m.done } : m
      ),
    })
  }

  return (
    <>
      <div className="stack">
        <section className="card card-tint-iris" style={{ padding: '1.4rem 1.35rem' }}>
          <p className="eyebrow" style={{ color: 'var(--iris)' }}>
            Goals
          </p>
          <h1 className="display" style={{ margin: '0.45rem 0 0.4rem' }}>
            What are you moving toward?
          </h1>
          <p className="muted">
            Name it, say why it matters, then break it into steps small enough to start today.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1.1rem' }}
            onClick={() => setEditing('new')}
          >
            + Set a goal
          </button>
        </section>

        {active.length === 0 && done.length === 0 && (
          <p className="empty">No goals yet. The first one is usually the hardest to name.</p>
        )}

        {active.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            work={recentWork[g.id]}
            sparkCount={inspo.filter((s) => s.goalId === g.id).length}
            onEdit={() => setEditing(g)}
            onToggle={(id) => toggleMilestone(g, id)}
            onComplete={() => {
              saveGoal({ ...g, doneAt: new Date().toISOString() })
              showToast('Goal complete 🎉')
            }}
          />
        ))}

        {done.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="display">Reached</h2>
            </div>
            {done.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onEdit={() => setEditing(g)}
                onToggle={(id) => toggleMilestone(g, id)}
                onReopen={() => saveGoal({ ...g, doneAt: null })}
              />
            ))}
          </>
        )}

        {archived.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="display">Set aside</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowArchived((s) => !s)}
              >
                {showArchived ? 'Hide' : `Show ${archived.length}`}
              </button>
            </div>
            {showArchived &&
              archived.map((g) => (
                <section className="card" key={g.id}>
                  <div className="row-between">
                    <span className="muted">{g.title}</span>
                    <div className="row" style={{ gap: '0.4rem', flexWrap: 'nowrap' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => saveGoal({ ...g, archived: false })}
                      >
                        Restore
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (confirm(`Delete "${g.title}" for good?`)) deleteGoal(g.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </section>
              ))}
          </>
        )}
      </div>

      {editing && (
        <GoalSheet
          goal={editing === 'new' ? null : editing}
          newId={newId}
          onClose={() => setEditing(null)}
          onSave={async (goal) => {
            const ok = await saveGoal(goal)
            if (ok) {
              showToast('Goal saved')
              setEditing(null)
            }
          }}
          onArchive={
            editing === 'new'
              ? null
              : async () => {
                  await saveGoal({ ...editing, archived: true })
                  showToast('Set aside')
                  setEditing(null)
                }
          }
        />
      )}
    </>
  )
}

function GoalCard({ goal, work, sparkCount = 0, onEdit, onToggle, onComplete, onReopen }) {
  const milestones = goal.milestones || []
  const done = milestones.filter((m) => m.done).length
  const pct = goal.doneAt
    ? 100
    : milestones.length
      ? Math.round((done / milestones.length) * 100)
      : 0

  let due = null
  if (goal.targetDate && isValidDateStr(goal.targetDate)) {
    const left = diffDays(todayStr(), goal.targetDate)
    due =
      left > 0
        ? `${left} day${left === 1 ? '' : 's'} left`
        : left === 0
          ? 'Due today'
          : `${Math.abs(left)} day${left === -1 ? '' : 's'} past`
  }

  return (
    <section className="card card-lift">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 className="display">
            <i
              className="goal-dot"
              style={{ background: goalAccent(goal.id), marginRight: 8, verticalAlign: 'middle' }}
            />
            {goal.title}
          </h3>
          {goal.why && (
            <p className="serif-quote" style={{ marginTop: '0.45rem' }}>
              “{goal.why}”
            </p>
          )}
        </div>
        <button className="icon-btn" onClick={onEdit} aria-label="Edit goal">
          ✎
        </button>
      </div>

      <div className="row" style={{ margin: '0.75rem 0 0.5rem' }}>
        {goal.horizon && (
          <span className="badge badge-quiet">
            {HORIZONS.find((h) => h.id === goal.horizon)?.label || goal.horizon}
          </span>
        )}
        {due && <span className="badge badge-gold">{due}</span>}
        {goal.targetDate && isValidDateStr(goal.targetDate) && (
          <span className="tiny">by {fmtShort(goal.targetDate)}</span>
        )}
      </div>

      <div className="meter">
        <i style={{ width: `${pct}%` }} />
      </div>

      {(work?.total > 0 || sparkCount > 0) && (
        <p className="tiny" style={{ marginTop: '0.6rem' }}>
          {work?.total > 0 && (
            <>
              This week: {work.done} of {work.total}{' '}
              {work.total === 1 ? 'priority' : 'priorities'} tied to this goal
              {work.done === work.total ? ' — all done' : ''}
            </>
          )}
          {work?.total > 0 && sparkCount > 0 && ' · '}
          {sparkCount > 0 && (
            <>
              {sparkCount} {sparkCount === 1 ? 'inspiration' : 'inspirations'} saved
            </>
          )}
        </p>
      )}

      {milestones.length > 0 && (
        <div style={{ marginTop: '0.85rem' }}>
          {milestones.map((m) => (
            <div className={`milestone${m.done ? ' done' : ''}`} key={m.id}>
              <button
                className={`tick${m.done ? ' on' : ''}`}
                style={{ width: 19, height: 19, fontSize: '0.62rem' }}
                aria-label={m.done ? 'Undo' : 'Done'}
                onClick={() => onToggle(m.id)}
              >
                x
              </button>
              <span>{m.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: '0.9rem' }}>
        {onComplete && (
          <button className="btn btn-sm btn-jade" onClick={onComplete}>
            Mark reached
          </button>
        )}
        {onReopen && (
          <button className="btn btn-sm btn-ghost" onClick={onReopen}>
            Reopen
          </button>
        )}
        {goal.doneAt && <span className="badge badge-jade">Reached</span>}
      </div>
    </section>
  )
}

function GoalSheet({ goal, onClose, onSave, onArchive, newId }) {
  const [title, setTitle] = useState(goal?.title || '')
  const [why, setWhy] = useState(goal?.why || '')
  const [horizon, setHorizon] = useState(goal?.horizon || 'season')
  const [targetDate, setTargetDate] = useState(goal?.targetDate || '')
  const [milestones, setMilestones] = useState(goal?.milestones || [])

  function submit() {
    if (!title.trim()) return
    onSave({
      ...(goal || {}),
      title: title.trim(),
      why: why.trim(),
      horizon,
      targetDate: targetDate.trim(),
      milestones: milestones
        .filter((m) => m.text.trim())
        .map((m) => ({ ...m, text: m.text.trim() })),
      archived: false,
    })
  }

  return (
    <Sheet
      title={goal ? 'Edit goal' : 'Set a goal'}
      subtitle={goal ? null : 'Specific beats ambitious.'}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-primary" onClick={submit} disabled={!title.trim()}>
            Save goal
          </button>
          {onArchive && (
            <button className="btn btn-danger" onClick={onArchive}>
              Set aside
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label className="field-label" htmlFor="goal-title">
            The goal
          </label>
          <input
            id="goal-title"
            type="text"
            value={title}
            placeholder="Ship a portfolio piece I'm proud of"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="goal-why">
            Why it matters
          </label>
          <textarea
            id="goal-why"
            value={why}
            placeholder="What changes for you if this happens?"
            onChange={(e) => setWhy(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field-label">Horizon</span>
          <div className="row">
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`chip${horizon === h.id ? ' on' : ''}`}
                onClick={() => {
                  setHorizon(h.id)
                  if (h.days && !targetDate) {
                    const d = new Date()
                    d.setDate(d.getDate() + h.days)
                    setTargetDate(
                      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                        d.getDate()
                      ).padStart(2, '0')}`
                    )
                  }
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="goal-date">
            Target date <span className="tiny">optional · YYYY-MM-DD</span>
          </label>
          <input
            id="goal-date"
            type="text"
            value={targetDate}
            placeholder="2026-11-02"
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ maxWidth: 220 }}
          />
        </div>

        <div className="divider" />

        <div className="field">
          <span className="field-label">Milestones</span>
          <p className="tiny">Small enough that the first one could start today.</p>
          {milestones.map((m, i) => (
            <div className="row" key={m.id} style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
              <span className="rank">{i + 1}</span>
              <input
                type="text"
                value={m.text}
                placeholder="A concrete step"
                onChange={(e) =>
                  setMilestones((prev) =>
                    prev.map((x) => (x.id === m.id ? { ...x, text: e.target.value } : x))
                  )
                }
              />
              <button
                className="icon-btn"
                aria-label="Remove milestone"
                onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() =>
              setMilestones((prev) => [...prev, { id: newId(), text: '', done: false }])
            }
          >
            + Add milestone
          </button>
        </div>
      </div>
    </Sheet>
  )
}
