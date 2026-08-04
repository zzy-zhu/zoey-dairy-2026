// All dates are handled in local time and stored as YYYY-MM-DD strings, which
// is the same format the original app wrote to Firestore.

export function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export function todayStr() {
  return localDateStr(new Date())
}

export function parseLocalDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isValidDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = parseLocalDate(s)
  return !Number.isNaN(d.getTime()) && localDateStr(d) === s
}

/** Whole days from a to b (both YYYY-MM-DD). Negative if b is before a. */
export function diffDays(a, b) {
  return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 864e5)
}

export function addDays(dateStr, n) {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

export function fmtLong(s) {
  return parseLocalDate(s).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtShort(s) {
  return parseLocalDate(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtDayMonth(s) {
  return parseLocalDate(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Late night'
}

// ─── Journey / week maths ────────────────────────────────────────────────────
// Week N covers days (N-1)*7+1 … N*7 counted from startDate. This is exactly
// the scheme the original app used, so weekKey() still resolves the weekly
// summaries already in the database — it just no longer stops at week 13.

export function dayNumber(startDate, dateStr = todayStr()) {
  return diffDays(startDate, dateStr) + 1
}

export function dayToDate(startDate, n) {
  return addDays(startDate, n - 1)
}

export function weekNumber(startDate, dateStr = todayStr()) {
  return Math.max(1, Math.ceil(dayNumber(startDate, dateStr) / 7))
}

export function weekKey(startDate, n) {
  return dayToDate(startDate, (n - 1) * 7 + 1)
}

export function weekRange(startDate, n) {
  return {
    startDay: (n - 1) * 7 + 1,
    endDay: n * 7,
    startDate: dayToDate(startDate, (n - 1) * 7 + 1),
    endDate: dayToDate(startDate, n * 7),
  }
}

export function weekLabel(startDate, n) {
  const { startDate: a, endDate: b } = weekRange(startDate, n)
  return `Week ${n} · ${fmtDayMonth(a)} → ${fmtDayMonth(b)}`
}

/** Chapters are 13-week blocks, used to page the weekly grid. */
export function chapterOfWeek(n) {
  return Math.ceil(n / 13)
}

export function weeksInChapter(chapter) {
  const first = (chapter - 1) * 13 + 1
  return Array.from({ length: 13 }, (_, i) => first + i)
}

/** Consecutive check-ins ending today (or yesterday, if today isn't written). */
export function currentStreak(checkins) {
  const today = todayStr()
  let cursor = checkins[today] ? today : addDays(today, -1)
  let n = 0
  while (checkins[cursor]) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Calendar month grid (weeks starting Sunday) for a given year/month. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const cells = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  const days = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= days; d++) cells.push(localDateStr(new Date(year, month, d)))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}
