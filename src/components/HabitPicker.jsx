import { useRef, useState } from 'react'

const SUGGESTED_ICONS = ['✷', '🏃', '📖', '🧘', '💧', '🌱', '🎧', '🍳', '☎️', '✍️', '😴', '🎸']

/**
 * The day's habit chips. Adding one here writes it into your habit list, so it
 * carries over and is there to tick tomorrow and every day after.
 */
export default function HabitPicker({ habitDefs, values, onToggle, onAddHabit }) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('✷')
  const [saving, setSaving] = useState(false)
  const input = useRef(null)

  async function submit() {
    const name = label.trim()
    if (!name) return
    setSaving(true)
    await onAddHabit({ icon: icon || '✷', label: name })
    setSaving(false)
    setLabel('')
    setIcon('✷')
    setAdding(false)
  }

  return (
    <div className="stack" style={{ gap: '0.7rem' }}>
      <div className="row">
        {habitDefs.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`chip${values[h.id] ? ' on' : ''}`}
            onClick={() => onToggle(h.id)}
          >
            <span style={{ fontSize: '1rem' }}>{h.icon}</span>
            {h.label}
          </button>
        ))}
        {onAddHabit && !adding && (
          <button
            type="button"
            className="chip chip-dashed"
            onClick={() => {
              setAdding(true)
              setTimeout(() => input.current?.focus(), 40)
            }}
          >
            + New habit
          </button>
        )}
      </div>

      {adding && (
        <div className="habit-add">
          <div className="row" style={{ gap: '0.4rem', flexWrap: 'nowrap' }}>
            <input
              type="text"
              value={icon}
              maxLength={2}
              aria-label="Icon"
              style={{ width: 56, textAlign: 'center', flex: 'none' }}
              onChange={(e) => setIcon(e.target.value)}
            />
            <input
              ref={input}
              type="text"
              value={label}
              placeholder="Stretch, water, no phone in bed…"
              aria-label="Habit name"
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') setAdding(false)
              }}
            />
          </div>
          <div className="row" style={{ gap: '0.3rem' }}>
            {SUGGESTED_ICONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`icon-pick${icon === s ? ' on' : ''}`}
                onClick={() => setIcon(s)}
                aria-label={`Use ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={submit}
              disabled={!label.trim() || saving}
            >
              {saving ? 'Adding…' : 'Add habit'}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
          <p className="tiny">It'll be here to tick tomorrow too — edit or remove it in Settings.</p>
        </div>
      )}
    </div>
  )
}
