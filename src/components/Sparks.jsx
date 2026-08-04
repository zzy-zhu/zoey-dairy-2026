import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { goalAccent } from '../lib/story.js'
import { fmtShort, todayStr } from '../lib/dates.js'

export const fmtStamp = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()}`
}

/**
 * Write down an inspiration the moment you have it. Each one keeps the date and
 * time it was written and can be tied to a long-term goal.
 */
export function SparkCapture({ goals, defaultGoalId = '', onSaved }) {
  const { saveInspo, showToast } = useStore()
  const [text, setText] = useState('')
  const [goalId, setGoalId] = useState(defaultGoalId)
  const [saving, setSaving] = useState(false)

  async function save() {
    const body = text.trim()
    if (!body) return
    setSaving(true)
    const saved = await saveInspo({
      kind: 'note',
      text: body,
      goalId: goalId || null,
      date: todayStr(),
    })
    setSaving(false)
    if (saved) {
      setText('')
      showToast('Written down ✓')
      onSaved?.(saved)
    }
  }

  return (
    <div className="stack" style={{ gap: '0.55rem' }}>
      <textarea
        value={text}
        placeholder="An idea, a line, something someone said…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
        }}
        style={{ minHeight: 74 }}
      />
      <div className="row">
        {goals.length > 0 && (
          <label className="row" style={{ gap: '0.35rem', flexWrap: 'nowrap' }}>
            <i
              className="goal-dot"
              style={{
                background: goalId ? goalAccent(goalId) : 'var(--hairline)',
              }}
            />
            <select
              className={`goal-select${goalId ? ' linked' : ''}`}
              value={goalId}
              aria-label="Tie this to a goal"
              onChange={(e) => setGoalId(e.target.value)}
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
        <span className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!text.trim() || saving}>
          {saving ? 'Saving…' : 'Write it down'}
        </button>
      </div>
    </div>
  )
}

/** One saved spark, with its stamp and goal. */
export function SparkRow({ spark, goals, onOpen, onDelete }) {
  const goal = goals.find((g) => g.id === spark.goalId) || null
  const isPage = spark.kind === 'page' || !!spark.ideas

  return (
    <div className="spark">
      <div className="row-between" style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isPage ? (
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: 0, textAlign: 'left', whiteSpace: 'normal' }}
              onClick={() => onOpen(spark)}
            >
              ✦ {spark.title}
            </button>
          ) : (
            <p className="spark-text">{spark.text}</p>
          )}
        </div>
        {onDelete && (
          <button
            className="icon-btn"
            style={{ flex: 'none' }}
            aria-label="Delete"
            onClick={() => {
              if (confirm('Delete this one?')) onDelete(spark.id)
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div className="spark-meta">
        <span>{spark.createdAt ? fmtStamp(spark.createdAt) : fmtShort(spark.date)}</span>
        {goal && (
          <span className="spark-goal">
            <i className="goal-dot" style={{ background: goalAccent(goal.id) }} />
            {goal.title}
          </span>
        )}
        {isPage && <span className="badge badge-gold">written by Claude</span>}
      </div>
    </div>
  )
}
