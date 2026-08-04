import { dayNumber, fmtLong } from './dates.js'

/**
 * Renders an entry as the plain-text `article` field. The original app stored
 * this alongside the answers and every archive view reads it, so entries stay
 * readable even after the prompts change.
 */
export function buildArticle({ date, startDate, questions, answers, habits, habitDefs, emotion }) {
  const n = dayNumber(startDate, date)
  const lines = [`Day ${n} — ${fmtLong(date)}`, '─'.repeat(44), '']

  const ticked = (habitDefs || [])
    .filter((h) => habits?.[h.id])
    .map((h) => `${h.icon} ${h.label}`)
  if (ticked.length) lines.push('Habits: ' + ticked.join('  ·  '))
  if (emotion) lines.push('Feeling: ' + emotion)
  if (ticked.length || emotion) lines.push('')

  questions.forEach((q, i) => {
    const a = (answers[i] || '').trim()
    if (a) {
      lines.push(q)
      lines.push(a)
      lines.push('')
    }
  })
  return lines.join('\n')
}

export function buildWeeklyArticle({ weekNum, label, questions, answers }) {
  const lines = [`Week ${weekNum} Reflection — ${label}`, '─'.repeat(44), '']
  questions.forEach((q, i) => {
    const a = (answers[i] || '').trim()
    if (a) {
      lines.push(q)
      lines.push(a)
      lines.push('')
    }
  })
  return lines.join('\n')
}

const clip = (s, n) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)

/**
 * First thing actually written, for list rows. Reads the answers where we have
 * them and only falls back to scraping the rendered article for older records.
 */
export function preview(entry, n = 90) {
  if (!entry) return ''
  const answers = Array.isArray(entry.answers) ? entry.answers : []
  const first = answers.map((a) => (a || '').trim()).find(Boolean)
  if (first) return clip(first.replace(/\s+/g, ' '), n)

  const body = (entry.article || '')
    .split('\n')
    .slice(2)
    .map((l) => l.trim())
    .filter((l) => l && !/^(Habits|Feeling):/.test(l) && !l.endsWith('?'))
    .join(' · ')
  return clip(body, n)
}
