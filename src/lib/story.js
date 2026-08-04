import { dayToDate, fmtDayMonth, parseLocalDate, weekLabel } from './dates.js'
import { streakStats } from './streak.js'
import { KINDS, memoPattern, patternHeadline, patternSentence } from './memos.js'

/**
 * Stable per-goal accent so a goal reads the same colour everywhere. Muted
 * enough to sit beside the blue and yellow without shouting.
 */
const ACCENTS = [
  'hsl(226 72% 42%)', // gauloise blue
  'hsl(41 88% 48%)', // mustard
  'hsl(14 55% 46%)', // terracotta
  'hsl(158 34% 34%)', // olive green
  'hsl(196 48% 40%)', // faded teal
  'hsl(300 26% 44%)', // plum
]
export function goalAccent(id = '') {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 997
  return ACCENTS[sum % ACCENTS.length]
}

const wordCount = (s) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

/** Everything measurable about one week, pulled from what's already loaded. */
export function weekStats({ weekNum, startDate, entries, days, goals, habitDefs, checkins, memos = [] }) {
  const dates = []
  for (let i = (weekNum - 1) * 7 + 1; i <= weekNum * 7; i++) {
    dates.push(dayToDate(startDate, i))
  }

  const weekEntries = dates
    .map((d) => entries.find((e) => e.date === d))
    .filter(Boolean)

  const written = dates.filter((d) => checkins[d]).length

  const words = weekEntries.reduce(
    (sum, e) => sum + (e.answers || []).reduce((s, a) => s + wordCount(a), 0),
    0
  )

  const habitCounts = habitDefs.map((h) => ({
    ...h,
    count: weekEntries.filter((e) => e.habits?.[h.id]).length,
  }))

  const moods = weekEntries
    .map((e) => (e.emotion || '').trim().toLowerCase())
    .filter(Boolean)
  const moodTally = {}
  moods.forEach((m) => {
    moodTally[m] = (moodTally[m] || 0) + 1
  })
  const topMood = Object.entries(moodTally).sort((a, b) => b[1] - a[1])[0] || null

  const priorities = dates.flatMap((d) =>
    (days[d]?.priorities || []).map((p) => ({ ...p, date: d }))
  )
  const prioritiesDone = priorities.filter((p) => p.done).length

  // Which goals the week actually went into, ranked by completed priorities.
  const goalTally = {}
  priorities.forEach((p) => {
    if (!p.goalId) return
    const t = (goalTally[p.goalId] ||= { goalId: p.goalId, total: 0, done: 0 })
    t.total++
    if (p.done) t.done++
  })
  const goalWork = Object.values(goalTally)
    .map((t) => ({ ...t, goal: goals.find((g) => g.id === t.goalId) || null }))
    .filter((t) => t.goal)
    .sort((a, b) => b.done - a.done || b.total - a.total)

  // The longest thing written that week, for the quote slide.
  let quote = null
  weekEntries.forEach((e) => {
    ;(e.answers || []).forEach((a) => {
      const text = (a || '').trim()
      if (text.length > (quote?.text.length || 0) && text.length > 24) {
        quote = { text, date: e.date }
      }
    })
  })

  // Notes pinned during the week, and the mix of what they were about.
  const weekMemos = memos.filter((m) => dates.includes(m.date))
  const pattern = memoPattern(weekMemos)

  const lastDate = dates[dates.length - 1]
  const busiest = weekEntries
    .map((e) => ({
      date: e.date,
      words: (e.answers || []).reduce((s, a) => s + wordCount(a), 0),
    }))
    .sort((a, b) => b.words - a.words)[0]

  return {
    weekNum,
    dates,
    label: weekLabel(startDate, weekNum),
    weekEntries,
    written,
    words,
    habitCounts,
    moods,
    topMood,
    priorities,
    prioritiesDone,
    goalWork,
    quote,
    busiest,
    memos: weekMemos,
    pattern,
    streak: streakStats(checkins).current,
    range: `${fmtDayMonth(dates[0])} – ${fmtDayMonth(lastDate)}`,
  }
}

const dayName = (d) => parseLocalDate(d).toLocaleDateString('en-US', { weekday: 'long' })

/**
 * Turns the numbers into a run of full-screen cards. Slides with nothing to
 * say are dropped, so a quiet week gets a short story rather than a bunch of
 * zeroes.
 */
export function buildStory(stats, note) {
  const slides = []

  slides.push({
    kind: 'cover',
    tint: 'iris',
    eyebrow: `Week ${stats.weekNum}`,
    headline: 'Your week,\nin review',
    sub: stats.range,
  })

  slides.push({
    kind: 'big',
    tint: 'iris',
    eyebrow: 'You showed up',
    big: `${stats.written}`,
    unit: stats.written === 1 ? 'day written' : 'days written',
    sub:
      stats.written === 7
        ? 'Every single day. All seven.'
        : stats.written >= 5
          ? 'Most of the week. That counts.'
          : stats.written > 0
            ? 'Some weeks are quieter. You still came back.'
            : 'A blank week. It happens.',
  })

  if (stats.words > 0) {
    slides.push({
      kind: 'big',
      tint: 'gold',
      eyebrow: 'In your own words',
      big: stats.words > 999 ? `${(stats.words / 1000).toFixed(1)}k` : `${stats.words}`,
      unit: 'words',
      sub: stats.busiest
        ? `${dayName(stats.busiest.date)} was your longest entry — ${stats.busiest.words} words.`
        : null,
    })
  }

  const habits = stats.habitCounts.filter((h) => h.count > 0)
  if (habits.length) {
    slides.push({
      kind: 'list',
      tint: 'jade',
      eyebrow: 'Habits',
      headline: 'What you kept up',
      items: habits.map((h) => ({
        icon: h.icon,
        label: h.label,
        value: `${h.count}×`,
        bar: h.count / 7,
      })),
    })
  }

  if (stats.topMood) {
    slides.push({
      kind: 'mood',
      tint: 'coral',
      eyebrow: 'How it felt',
      big: stats.topMood[0],
      sub:
        stats.topMood[1] > 1
          ? `You wrote that word ${stats.topMood[1]} times this week.`
          : 'The word you reached for.',
      items: stats.moods,
    })
  }

  if (stats.priorities.length) {
    slides.push({
      kind: 'big',
      tint: 'jade',
      eyebrow: 'Priorities',
      big: `${stats.prioritiesDone}`,
      unit: `of ${stats.priorities.length} done`,
      sub:
        stats.prioritiesDone === stats.priorities.length
          ? 'You cleared everything you set.'
          : stats.prioritiesDone > 0
            ? 'Not everything — but the ones that mattered got done.'
            : 'Setting them is half of it.',
    })
  }

  if (stats.goalWork.length) {
    const top = stats.goalWork[0]
    slides.push({
      kind: 'goal',
      tint: 'iris',
      eyebrow: 'Where the week went',
      headline: top.goal.title,
      sub: `${top.done} of ${top.total} priorities tied to this goal got done.`,
      accent: goalAccent(top.goal.id),
      items: stats.goalWork.slice(1, 4).map((t) => ({
        label: t.goal.title,
        value: `${t.done}/${t.total}`,
        accent: goalAccent(t.goal.id),
      })),
    })
  }

  if (stats.memos.length) {
    slides.push({
      kind: 'memos',
      tint: 'jade',
      eyebrow: 'Pinned this week',
      headline: `${stats.memos.length} ${stats.memos.length === 1 ? 'note' : 'notes'}`,
      memos: stats.memos.slice(0, 6),
    })

    if (stats.memos.length > 1) {
      slides.push({
        kind: 'pattern',
        tint: 'gold',
        eyebrow: 'The pattern',
        headline: patternHeadline(stats.pattern),
        sub: patternSentence(stats.pattern),
        items: KINDS.filter((k) => stats.pattern.counts[k.id]).map((k) => ({
          label: k.label,
          value: `${stats.pattern.counts[k.id]}`,
          bar: stats.pattern.counts[k.id] / stats.pattern.total,
        })),
      })
    }
  }

  if (stats.quote) {
    slides.push({
      kind: 'quote',
      tint: 'gold',
      eyebrow: dayName(stats.quote.date),
      headline: stats.quote.text.length > 260
        ? stats.quote.text.slice(0, 260).trimEnd() + '…'
        : stats.quote.text,
      sub: 'You wrote this.',
    })
  }

  if (stats.streak > 1) {
    slides.push({
      kind: 'big',
      tint: 'coral',
      eyebrow: 'Streak',
      big: `${stats.streak}`,
      unit: 'days in a row',
      sub: 'Still going.',
    })
  }

  slides.push({
    kind: 'closing',
    tint: 'iris',
    eyebrow: 'And that was week ' + stats.weekNum,
    headline: note?.headline || 'Onward.',
    sub: note?.body || null,
    canGenerate: !note,
  })

  return slides
}
