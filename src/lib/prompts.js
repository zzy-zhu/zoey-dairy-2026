import { diffDays, parseLocalDate, todayStr } from './dates.js'

/**
 * The seven prompts the original app shipped with. Entries written before the
 * set was concentrated to five have no `questionsSnapshot`, so this is what
 * their answers line up against.
 */
export const LEGACY_QUESTIONS = [
  "What's one thing you're genuinely looking forward to today?",
  'What did you learn yesterday — about yourself, your work, or the world?',
  'What is one specific thing you want to move forward on in your learning today?',
  "What's the smallest step you can take today toward your career goal?",
  'How are you feeling right now? Any emotion worth noticing?',
  "What's one thing you're grateful for, however small?",
  'In 90 days, who do you want to have become?',
]

/**
 * Which prompts an entry's answers belong to. A snapshot wins; otherwise an
 * entry holding more answers than there are current prompts was written against
 * the original set, and every answer is kept rather than truncated.
 */
export function resolveQuestions(entry, questions) {
  if (entry?.questionsSnapshot?.length) return entry.questionsSnapshot
  const answered = entry?.answers?.length || 0
  if (answered > questions.length) {
    return Array.from(
      { length: answered },
      (_, i) => LEGACY_QUESTIONS[i] || `Earlier prompt ${i + 1}`
    )
  }
  return questions
}

/**
 * A line to write from when the blank page is the problem. One per day, picked
 * deterministically from the date so it holds still while you're writing and
 * changes tomorrow.
 */
export const SPARKS = [
  'Describe today in the third person, like it happened to someone else.',
  'What would you do this week if nobody would see the result?',
  'Write the sentence you have been avoiding writing.',
  'What did you notice today that nobody else would have?',
  'Finish this: the part I keep getting wrong is…',
  'What are you pretending not to know?',
  'Describe a small thing in the room as if you had to remember it forever.',
  'Who were you a year ago, and what would they ask you?',
  'What is the most interesting problem in front of you right now?',
  'Write down the advice you would give a friend in your position.',
  'What did you make today, even if it was small or bad?',
  'Which of your worries would look silly written down? Write it down.',
  'What is worth doing badly rather than not at all?',
  'Name the thing you are actually afraid of underneath the busy version.',
  'What have you changed your mind about lately?',
  'Describe the best ten minutes of today in detail.',
  'What would make tomorrow feel like a good day, specifically?',
  'Write about something you saw that you have no use for.',
  'What are you doing out of habit that you could stop?',
  'Who deserves a message from you, and what would it say?',
  'What does your work look like when it is going well?',
  'Write the version of your plan that takes half the time.',
  'What do you want less of, and what would fill the gap?',
  'Describe a sound from today.',
  'What is true now that was not true a month ago?',
  'If today were a chapter, what would it be called?',
  'Write down a question you would like a year to answer.',
  'What did someone else do today that you admired?',
]

/** Stable day-to-spark mapping, anchored so it walks forward one per day. */
export function sparkForDate(date = todayStr()) {
  const anchor = '2026-01-01'
  const n = Math.abs(diffDays(anchor, date))
  return SPARKS[n % SPARKS.length]
}

export function sparkLabel(date = todayStr()) {
  return parseLocalDate(date).toLocaleDateString('en-US', {
    weekday: 'long',
  })
}
