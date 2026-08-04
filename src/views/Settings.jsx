import { useState } from 'react'
import { useStore, DEFAULT_QUESTIONS, DEFAULT_WEEKLY_QUESTIONS } from '../lib/store.jsx'
import { fmtLong, isValidDateStr } from '../lib/dates.js'

const THEMES = [
  { id: 'auto', label: 'Auto', icon: '◐' },
  { id: 'jour', label: 'Jour', icon: '☀' },
  { id: 'nuit', label: 'Nuit', icon: '☾' },
]

export default function Settings({ theme, setTheme }) {
  const { user, meta, patchMeta, exportAll, signOut, showToast, newId } = useStore()

  return (
    <div className="stack">
      <section className="card card-lift">
        <div className="row-between">
          <div>
            <h1 className="display" style={{ fontSize: '1.25rem' }}>
              {user?.displayName || 'Signed in'}
            </h1>
            <p className="tiny" style={{ marginTop: 3 }}>
              {user?.email}
            </p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>

      <section className="card">
        <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>
          Palette
        </div>
        <div className="row">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`chip${theme === t.id ? ' on' : ''}`}
              onClick={() => setTheme(t.id)}
            >
              <span style={{ fontSize: '0.95rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <PromptEditor
        title="Daily prompts"
        hint="What you're asked each morning."
        value={meta.questions}
        defaults={DEFAULT_QUESTIONS}
        onSave={(questions) => {
          patchMeta({ questions })
          showToast('Daily prompts saved')
        }}
      />

      <PromptEditor
        title="Weekly prompts"
        hint="What you're asked at the end of a week."
        value={meta.weeklyQuestions}
        defaults={DEFAULT_WEEKLY_QUESTIONS}
        onSave={(weeklyQuestions) => {
          patchMeta({ weeklyQuestions })
          showToast('Weekly prompts saved')
        }}
      />

      <HabitEditor
        habits={meta.habits}
        newId={newId}
        onSave={(habits) => {
          patchMeta({ habits })
          showToast('Habits saved')
        }}
      />

      <StartDate
        startDate={meta.startDate}
        onSave={(startDate) => {
          patchMeta({ startDate })
          showToast('Start date updated')
        }}
      />

      <section className="card">
        <h3 className="display" style={{ marginBottom: '0.4rem' }}>
          Your data
        </h3>
        <p className="muted" style={{ marginBottom: '0.9rem' }}>
          Everything lives in your own Firebase project — the same one the original 90-day app
          wrote to, so nothing was left behind.
        </p>
        <div className="row">
          <button className="btn" onClick={exportAll}>
            ↓ Download archive
          </button>
          <a className="btn btn-ghost" href="./legacy.html" target="_blank" rel="noreferrer">
            Open the old app ↗
          </a>
        </div>
      </section>
    </div>
  )
}

function PromptEditor({ title, hint, value, defaults, onSave }) {
  const [items, setItems] = useState(value)
  const dirty = JSON.stringify(items) !== JSON.stringify(value)

  return (
    <section className="card">
      <h3 className="display" style={{ marginBottom: '0.25rem' }}>
        {title}
      </h3>
      <p className="tiny" style={{ marginBottom: '0.85rem' }}>
        {hint}
      </p>

      <div className="stack" style={{ gap: '0.5rem' }}>
        {items.map((q, i) => (
          <div className="row" key={i} style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
            <span className="rank">{i + 1}</span>
            <input
              type="text"
              value={q}
              onChange={(e) =>
                setItems((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
            <button
              className="icon-btn"
              aria-label="Remove prompt"
              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: '0.85rem' }}>
        <button className="btn btn-sm" onClick={() => setItems((prev) => [...prev, ''])}>
          + Add prompt
        </button>
        <button
          className="btn btn-sm btn-jade"
          disabled={!dirty}
          onClick={() => onSave(items.map((s) => s.trim()).filter(Boolean))}
        >
          Save
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => setItems(defaults)}>
          Reset to defaults
        </button>
      </div>
    </section>
  )
}

function HabitEditor({ habits, onSave, newId }) {
  const [items, setItems] = useState(habits)
  const dirty = JSON.stringify(items) !== JSON.stringify(habits)

  return (
    <section className="card">
      <h3 className="display" style={{ marginBottom: '0.25rem' }}>
        Habits
      </h3>
      <p className="tiny" style={{ marginBottom: '0.85rem' }}>
        The daily ticks. Removing one hides it going forward — past entries keep their ticks.
      </p>

      <div className="stack" style={{ gap: '0.5rem' }}>
        {items.map((h, i) => (
          <div className="row" key={h.id} style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
            <input
              type="text"
              value={h.icon}
              maxLength={2}
              aria-label="Icon"
              style={{ width: 58, textAlign: 'center', flex: 'none' }}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x))
                )
              }
            />
            <input
              type="text"
              value={h.label}
              aria-label="Habit name"
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x))
                )
              }
            />
            <button
              className="icon-btn"
              aria-label="Remove habit"
              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: '0.85rem' }}>
        <button
          className="btn btn-sm"
          onClick={() =>
            setItems((prev) => [...prev, { id: `h-${newId().slice(0, 8)}`, icon: '✷', label: '' }])
          }
        >
          + Add habit
        </button>
        <button
          className="btn btn-sm btn-jade"
          disabled={!dirty}
          onClick={() =>
            onSave(
              items
                .filter((h) => h.label.trim())
                .map((h) => ({ ...h, label: h.label.trim(), icon: h.icon.trim() || '✷' }))
            )
          }
        >
          Save
        </button>
      </div>
    </section>
  )
}

function StartDate({ startDate, onSave }) {
  const [value, setValue] = useState(startDate || '')
  const valid = isValidDateStr(value)

  return (
    <section className="card">
      <h3 className="display" style={{ marginBottom: '0.25rem' }}>
        Day one
      </h3>
      <p className="tiny" style={{ marginBottom: '0.85rem' }}>
        {startDate ? fmtLong(startDate) : 'Not set'} — this is what "Day 114" counts from, and it
        anchors the week numbers. Changing it renumbers everything, so entries stay put but their
        day labels shift.
      </p>
      <div className="row">
        <input
          type="text"
          value={value}
          placeholder="2026-04-13"
          onChange={(e) => setValue(e.target.value)}
          style={{ maxWidth: 200 }}
        />
        <button
          className="btn btn-sm btn-jade"
          disabled={!valid || value === startDate}
          onClick={() => {
            if (confirm('Renumber every day from this date?')) onSave(value)
          }}
        >
          Update
        </button>
      </div>
      {value && !valid && (
        <p className="tiny" style={{ marginTop: '0.5rem', color: 'var(--coral)' }}>
          Needs to look like 2026-04-13.
        </p>
      )}
    </section>
  )
}
