/**
 * Daily memos: short notes pinned to a day, each in a shape you pick. The
 * shape is decoration; the *kind* is the part that means something, because
 * the mix of kinds across a week becomes that week's pattern.
 */

export const SHAPES = [
  { id: 'square', label: 'Post-it' },
  { id: 'taped', label: 'Taped' },
  { id: 'torn', label: 'Torn' },
  { id: 'folded', label: 'Folded' },
  { id: 'bubble', label: 'Speech' },
  { id: 'blob', label: 'Blob' },
  { id: 'arch', label: 'Arch' },
  { id: 'circle', label: 'Coin' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'burst', label: 'Burst' },
  { id: 'wave', label: 'Scallop' },
  { id: 'ribbon', label: 'Banner' },
  { id: 'hex', label: 'Hex' },
]

export const KINDS = [
  {
    id: 'action',
    label: 'Action',
    icon: '→',
    hint: 'something you did',
    color: 'var(--memo-blue)',
    ink: 'var(--memo-blue-ink)',
  },
  {
    id: 'emotion',
    label: 'Emotion',
    icon: '♡',
    hint: 'something you felt',
    color: 'var(--memo-rose)',
    ink: 'var(--memo-rose-ink)',
  },
  {
    id: 'day',
    label: 'The day',
    icon: '☼',
    hint: 'what the day was like',
    color: 'var(--memo-yellow)',
    ink: 'var(--memo-yellow-ink)',
  },
]

export const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[2]

/** Deterministic small rotation, so a memo doesn't jump around on re-render. */
export function wobble(id = '') {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i) * (i + 3)) % 991
  return ((sum % 9) - 4) * 0.75 // about -3deg … +3deg
}

/** Counts by kind plus the one that led the week. */
export function memoPattern(memos) {
  const counts = { action: 0, emotion: 0, day: 0 }
  memos.forEach((m) => {
    if (counts[m.kind] != null) counts[m.kind]++
  })
  const total = memos.length
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const [topKind, topCount] = ranked[0] || ['day', 0]
  // More than one kind can share the lead — say so rather than picking one.
  const tied = ranked.filter(([, n]) => n === topCount && n > 0).map(([k]) => k)
  const shapeTally = {}
  memos.forEach((m) => {
    shapeTally[m.shape] = (shapeTally[m.shape] || 0) + 1
  })
  const favouriteShape =
    Object.entries(shapeTally).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return { counts, total, topKind, topCount, tied, ranked, favouriteShape }
}

const VERB = { action: 'doing', emotion: 'feeling', day: 'noticing' }

const list = (items) =>
  items.length < 2
    ? items[0] || ''
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

/** One line describing the week's mix, for the recap and the weekly summary. */
export function patternSentence(pattern) {
  const { counts, total, topKind, topCount, tied } = pattern
  if (!total) return null

  const parts = [
    counts.action && `${counts.action} action`,
    counts.emotion && `${counts.emotion} emotion`,
    counts.day && `${counts.day} day`,
  ].filter(Boolean)
  const tail = `${parts.join(', ')} out of ${total} notes.`

  if (topCount === total && total > 1) {
    return `Every note this week was about ${VERB[topKind]}.`
  }
  if (tied.length === 3) return `Evenly spread this week — ${tail}`
  if (tied.length === 2) {
    return `An even split between ${list(tied.map((k) => VERB[k]))} this week — ${tail}`
  }
  return `Mostly ${VERB[topKind]} this week — ${tail}`
}

/** The recap slide's headline for a week's mix. */
export function patternHeadline(pattern) {
  if (!pattern.total) return 'A quiet week'
  if (pattern.tied.length > 1) return 'A week of\nboth ways'
  return `A week of ${VERB[pattern.topKind]}`
}

/** The block appended to a saved weekly summary. */
export function memosToText(memos) {
  if (!memos.length) return ''
  const pattern = memoPattern(memos)
  const lines = ['Notes pinned this week', '─'.repeat(44), '']
  const sentence = patternSentence(pattern)
  if (sentence) {
    lines.push(sentence)
    lines.push('')
  }
  memos.forEach((m) => {
    const k = kindOf(m.kind)
    const time = new Date(m.createdAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    lines.push(`[${k.label}] ${time} — ${m.text}`)
  })
  lines.push('')
  return lines.join('\n')
}
