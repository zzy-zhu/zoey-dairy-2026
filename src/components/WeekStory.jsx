import { useMemo, useState } from 'react'
import Story from './Story.jsx'
import { useStore } from '../lib/store.jsx'
import { buildStory, weekStats } from '../lib/story.js'
import { weekKey } from '../lib/dates.js'

/** Wires a week's data into the story player and caches Claude's closing note. */
export default function WeekStory({ weekNum, onClose }) {
  const { meta, entries, days, goals, stories, saveStoryNote, showToast } = useStore()
  const [generating, setGenerating] = useState(false)

  const key = weekKey(meta.startDate, weekNum)
  const note = stories[key] || null

  const stats = useMemo(
    () =>
      weekStats({
        weekNum,
        startDate: meta.startDate,
        entries,
        days,
        goals,
        habitDefs: meta.habits,
        checkins: meta.checkins,
      }),
    [weekNum, meta, entries, days, goals]
  )

  const slides = useMemo(() => buildStory(stats, note), [stats, note])

  async function generateNote() {
    setGenerating(true)
    try {
      const { generateWeekNote } = await import('../lib/insights.js')
      const summary = [
        `${stats.written} of 7 days written`,
        `${stats.words} words`,
        stats.topMood ? `most common feeling: ${stats.topMood[0]}` : null,
        stats.priorities.length
          ? `${stats.prioritiesDone} of ${stats.priorities.length} priorities done`
          : null,
        stats.goalWork.length
          ? `most worked-on goal: ${stats.goalWork[0].goal.title}`
          : null,
        stats.streak > 1 ? `${stats.streak}-day streak` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const quotes = stats.weekEntries
        .flatMap((e) => (e.answers || []).map((a) => (a || '').trim()))
        .filter(Boolean)
        .slice(0, 12)
        .join('\n')

      const result = await generateWeekNote({ label: stats.label, summary, quotes })
      await saveStoryNote(key, { weekNum, headline: result.headline, body: result.body })
    } catch (e) {
      showToast(e.message || 'Could not write the closing card')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Story
      slides={slides}
      title={`Week ${weekNum}`}
      onClose={onClose}
      onGenerateNote={generateNote}
      generating={generating}
    />
  )
}
