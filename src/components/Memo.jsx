import { kindOf, wobble } from '../lib/memos.js'

/**
 * One memo in its chosen shape. The shape is pure CSS (`data-shape`), so a
 * memo written months ago still renders the way it was pinned.
 */
export default function Memo({ memo, onClick, small = false }) {
  const kind = kindOf(memo.kind)
  const stamp = memo.createdAt
    ? new Date(memo.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

  const body = (
    <>
      <span className="memo-kind" aria-hidden="true">
        {kind.icon}
      </span>
      <span className="memo-text">{memo.text}</span>
      {!small && stamp && <span className="memo-stamp">{stamp.toLowerCase()}</span>}
    </>
  )

  const style = {
    '--memo-bg': kind.color,
    '--memo-ink': kind.ink,
    '--rot': `${wobble(memo.id || memo.text)}deg`,
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={`memo${small ? ' memo-small' : ''}`}
        data-shape={memo.shape || 'square'}
        style={style}
        onClick={() => onClick(memo)}
        title={`${kind.label} · ${stamp}`}
      >
        {body}
      </button>
    )
  }

  return (
    <div
      className={`memo${small ? ' memo-small' : ''}`}
      data-shape={memo.shape || 'square'}
      style={style}
    >
      {body}
    </div>
  )
}
