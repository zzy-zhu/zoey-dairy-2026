import { useEffect, useState } from 'react'
import { msUntilMidnight, splitDuration } from '../lib/streak.js'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Ticking time left in the day. `calm` drops the urgency colour for when
 * today's already written and the clock is just information.
 */
export default function Countdown({ label = 'Time left to log today', calm = false }) {
  const [left, setLeft] = useState(() => msUntilMidnight())

  useEffect(() => {
    const t = setInterval(() => setLeft(msUntilMidnight()), 1000)
    return () => clearInterval(t)
  }, [])

  const { hours, minutes, seconds } = splitDuration(left)
  const urgent = !calm && hours < 2

  return (
    <div className="countdown">
      <span className="eyebrow">{label}</span>
      <div className={`countdown-clock${urgent ? ' urgent' : ''}`}>
        <span>{pad(hours)}</span>
        <i>:</i>
        <span>{pad(minutes)}</span>
        <i>:</i>
        <span>{pad(seconds)}</span>
      </div>
    </div>
  )
}

/** A live wall clock for the dashboard header. */
export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <span className="os-clock">
      {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      <i>{now.getSeconds() % 2 ? ' ' : ':'}</i>
      {pad(now.getSeconds())}
    </span>
  )
}
