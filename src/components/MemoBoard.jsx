import { useState } from 'react'
import Memo from './Memo.jsx'
import { useStore } from '../lib/store.jsx'
import { KINDS, SHAPES, kindOf, memoPattern, patternSentence } from '../lib/memos.js'
import { todayStr } from '../lib/dates.js'

const MAX_LEN = 180

/** Pin a memo: pick a shape, pick what it's about, write a line. */
export function MemoComposer({ date = todayStr(), onPinned }) {
  const { saveMemo, showToast } = useStore()
  const [open, setOpen] = useState(false)
  const [shape, setShape] = useState('square')
  const [kind, setKind] = useState('day')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function pin() {
    const body = text.trim()
    if (!body) return
    setSaving(true)
    const saved = await saveMemo({ date, text: body, shape, kind })
    setSaving(false)
    if (saved) {
      setText('')
      setOpen(false)
      showToast('Pinned ✓')
      onPinned?.(saved)
    }
  }

  if (!open) {
    return (
      <button className="btn btn-sm" onClick={() => setOpen(true)}>
        + Pin a note
      </button>
    )
  }

  return (
    <div className="memo-composer">
      <div className="field">
        <span className="field-label">What's it about?</span>
        <div className="row">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`chip${kind === k.id ? ' on' : ''}`}
              onClick={() => setKind(k.id)}
            >
              <span aria-hidden="true">{k.icon}</span>
              {k.label}
            </button>
          ))}
        </div>
        <p className="tiny">{kindOf(kind).hint} — the mix becomes your weekly pattern.</p>
      </div>

      <div className="field">
        <span className="field-label">Shape</span>
        <div className="shape-picker scroll-x">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`shape-swatch${shape === s.id ? ' on' : ''}`}
              data-shape={s.id}
              style={{ '--memo-bg': kindOf(kind).color, '--memo-ink': kindOf(kind).ink }}
              onClick={() => setShape(s.id)}
              title={s.label}
              aria-label={s.label}
            />
          ))}
        </div>
      </div>

      <textarea
        value={text}
        maxLength={MAX_LEN}
        placeholder="Short and true. One thought per note."
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) pin()
        }}
        style={{ minHeight: 68 }}
      />

      <div className="row">
        <span className="tiny">
          {MAX_LEN - text.length} left
        </span>
        <span className="spacer" />
        <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button className="btn btn-sm btn-primary" onClick={pin} disabled={!text.trim() || saving}>
          {saving ? 'Pinning…' : 'Pin it'}
        </button>
      </div>

      {text.trim() && (
        <div className="memo-board memo-board-preview">
          <Memo memo={{ id: 'preview', text: text.trim(), shape, kind }} />
        </div>
      )}
    </div>
  )
}

/** A scattered board of memos, with an optional pattern line underneath. */
export function MemoBoard({ memos, onDelete, showPattern = false, small = false, empty }) {
  const { showToast } = useStore()
  if (!memos.length) {
    return empty ? <p className="empty">{empty}</p> : null
  }
  const pattern = memoPattern(memos)

  return (
    <>
      <div className="memo-board">
        {memos.map((m) => (
          <Memo
            key={m.id}
            memo={m}
            small={small}
            onClick={
              onDelete
                ? (memo) => {
                    if (confirm(`Unpin "${memo.text.slice(0, 40)}"?`)) {
                      onDelete(memo.id)
                      showToast('Unpinned')
                    }
                  }
                : undefined
            }
          />
        ))}
      </div>
      {showPattern && pattern.total > 1 && (
        <>
          <div className="pattern-bar" aria-hidden="true">
            {KINDS.map((k) =>
              pattern.counts[k.id] ? (
                <i
                  key={k.id}
                  style={{
                    width: `${(pattern.counts[k.id] / pattern.total) * 100}%`,
                    background: k.color,
                  }}
                  title={`${k.label}: ${pattern.counts[k.id]}`}
                />
              ) : null
            )}
          </div>
          <p className="tiny" style={{ marginTop: '0.4rem' }}>
            {patternSentence(pattern)}
          </p>
        </>
      )}
    </>
  )
}
