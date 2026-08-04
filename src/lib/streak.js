import { addDays, diffDays, todayStr } from './dates.js'

/**
 * Everything about the chain of days you've written, computed from the check-in
 * map. A streak stays "alive" through today until midnight — writing yesterday
 * and not yet today doesn't break it, it just means today is still open.
 */
export function streakStats(checkins, today = todayStr()) {
  const days = Object.keys(checkins)
    .filter((d) => checkins[d])
    .sort()

  const todayDone = !!checkins[today]
  const yesterday = addDays(today, -1)

  // Current run: count back from today, or from yesterday if today is still open.
  let current = 0
  let cursor = todayDone ? today : yesterday
  while (checkins[cursor]) {
    current++
    cursor = addDays(cursor, -1)
  }

  // Longest run ever, walking the sorted list.
  let best = 0
  let run = 0
  let prev = null
  days.forEach((d) => {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1
    if (run > best) best = run
    prev = d
  })

  const first = days[0] || null
  const lastWritten = days[days.length - 1] || null

  // Is the chain still standing, or has it already lapsed?
  const alive = todayDone || !!checkins[yesterday]
  const brokenFor = lastWritten ? diffDays(lastWritten, today) : null

  // The last 28 days, oldest first, for the ribbon.
  const ribbon = Array.from({ length: 28 }, (_, i) => {
    const date = addDays(today, -(27 - i))
    return { date, done: !!checkins[date], isToday: date === today }
  })

  const last7 = ribbon.slice(-7).filter((d) => d.done).length
  const last30Rate = Math.round((ribbon.filter((d) => d.done).length / 28) * 100)

  return {
    current,
    best: Math.max(best, current),
    total: days.length,
    todayDone,
    alive,
    brokenFor,
    first,
    lastWritten,
    ribbon,
    last7,
    last30Rate,
    /** Days written since day one, as a share of days elapsed. */
    consistency: first ? Math.round((days.length / (diffDays(first, today) + 1)) * 100) : 0,
  }
}

/** The line under the streak number. */
export function streakLine(s) {
  if (s.total === 0) return 'Write today and the chain starts.'
  if (s.todayDone && s.current === s.best && s.current > 2) return `Your longest run yet.`
  if (s.todayDone) return 'Logged today. Chain intact.'
  if (s.alive && s.current > 0) return `Still standing — write today to make it ${s.current + 1}.`
  if (s.brokenFor === 2) return 'One day missed. Pick it back up today.'
  return `${s.brokenFor} days since the last entry. Today can be day one.`
}

/** Milliseconds until local midnight — the deadline for today's log. */
export function msUntilMidnight(now = new Date()) {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight - now
}

export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}
