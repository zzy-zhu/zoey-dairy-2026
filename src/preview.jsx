// Local-only harness: renders the views against fixture data so the layout can
// be inspected without signing in. Not part of the production build.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreContext, DEFAULT_QUESTIONS, DEFAULT_WEEKLY_QUESTIONS, DEFAULT_HABITS } from './lib/store.jsx'
import { buildArticle, buildWeeklyArticle } from './lib/format.js'
import { addDays, todayStr, weekKey, weekLabel, weekNumber } from './lib/dates.js'
import WeekStory from './components/WeekStory.jsx'
import ZOS from './views/ZOS.jsx'
import Today from './views/Today.jsx'
import Goals from './views/Goals.jsx'
import Weekly from './views/Weekly.jsx'
import Journal from './views/Journal.jsx'
import Insights from './views/Insights.jsx'
import Settings from './views/Settings.jsx'
import './styles.css'

const START = addDays(todayStr(), -113)

const SAMPLE = [
  'Coffee on the balcony before anyone else is up.',
  'That the hard part was never the code — it was deciding what to build.',
  'Finish the typography pass on the case study.',
  'Send one message to someone whose work I admire.',
  'Tired but in a good way. Steady.',
  'The neighbour who waters my plants without being asked.',
  'Someone who ships things she is proud of and sleeps well.',
]

const entries = Array.from({ length: 26 }, (_, i) => {
  const date = addDays(todayStr(), -i * 2)
  const answers = SAMPLE.map((s, j) => (j % 2 === i % 2 ? s : ''))
  const habits = { exercise: i % 3 !== 0, reading: i % 2 === 0 }
  const emotion = ['steady', 'hopeful', 'tired', 'clear', 'restless'][i % 5]
  return {
    date,
    answers,
    habits,
    emotion,
    questionsSnapshot: DEFAULT_QUESTIONS,
    article: buildArticle({
      date,
      startDate: START,
      questions: DEFAULT_QUESTIONS,
      answers,
      habits,
      habitDefs: DEFAULT_HABITS,
      emotion,
    }),
  }
})

const checkins = {}
entries.forEach((e) => {
  checkins[e.date] = true
})
checkins[todayStr()] = true

const weeklyEntries = [16, 15, 14, 13].map((n) => ({
  weekKey: weekKey(START, n),
  weekNum: n,
  answers: DEFAULT_WEEKLY_QUESTIONS.map((_, i) =>
    i < 3 ? 'Shipped the thing, said no twice, slept properly.' : ''
  ),
  questionsSnapshot: DEFAULT_WEEKLY_QUESTIONS,
  article: buildWeeklyArticle({
    weekNum: n,
    label: weekLabel(START, n),
    questions: DEFAULT_WEEKLY_QUESTIONS,
    answers: DEFAULT_WEEKLY_QUESTIONS.map(() => 'Shipped the thing, said no twice, slept properly.'),
  }),
}))

const goals = [
  {
    id: 'g1',
    title: 'Publish the portfolio I keep almost finishing',
    why: 'I want the work to speak before I do.',
    horizon: 'season',
    targetDate: addDays(todayStr(), 41),
    milestones: [
      { id: 'm1', text: 'Pick the three projects', done: true },
      { id: 'm2', text: 'Write the case study for the first one', done: true },
      { id: 'm3', text: 'Design pass on typography', done: false },
      { id: 'm4', text: 'Ship to a real domain', done: false },
    ],
    createdAt: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'g2',
    title: 'Run 5k without stopping',
    why: 'Because I want the mornings back.',
    horizon: 'month',
    targetDate: addDays(todayStr(), 12),
    milestones: [
      { id: 'm5', text: 'Three runs a week for two weeks', done: true },
      { id: 'm6', text: '3k continuous', done: false },
    ],
    createdAt: '2026-06-10T09:00:00.000Z',
  },
  {
    id: 'g3',
    title: 'Read twelve books this year',
    why: 'Fewer feeds, more chapters.',
    horizon: 'year',
    targetDate: '',
    milestones: [],
    createdAt: '2026-01-04T09:00:00.000Z',
    doneAt: '2026-07-20T09:00:00.000Z',
  },
]

const days = {
  [todayStr()]: {
    priorities: [
      { id: 'p1', text: 'Typography pass on the case study', done: true, goalId: 'g1' },
      { id: 'p2', text: 'Reply to Mei about the workshop', done: false, goalId: null },
      { id: 'p3', text: 'Walk before the light goes', done: false, goalId: 'g2' },
    ],
  },
}
// A week's worth of linked priorities so the story has something to show.
for (let i = 1; i < 7; i++) {
  const d = addDays(todayStr(), -i)
  days[d] = {
    priorities: [
      { id: `a${i}`, text: 'Move the portfolio forward', done: i % 3 !== 0, goalId: 'g1' },
      { id: `b${i}`, text: 'Run', done: i % 2 === 0, goalId: 'g2' },
    ],
  }
}

const inspo = [
  {
    id: 'i1',
    date: todayStr(),
    title: 'The version of this that takes an afternoon',
    opening:
      'You keep describing the portfolio as almost finished, which usually means the remaining work is a decision rather than a task.',
    ideas: [
      {
        title: 'Ship the two you have',
        body: 'Three projects was your number, not a requirement. Two finished case studies read better than three half-written ones.',
      },
      {
        title: 'Let the typography be boring',
        body: 'You have rewritten the type pass twice. Pick the one you had on Tuesday and move on.',
      },
      {
        title: 'Send it before it is ready',
        body: 'Mei asked about your work. A rough link with a note beats a polished one that never goes out.',
      },
    ],
    smallStep: 'Open the case study and set the body type once, without changing anything else.',
    closing: 'The work is closer than the feeling about the work.',
    createdAt: new Date('2026-08-04T09:00:00Z').toISOString(),
  },
]

const MEMO_SEED = [
  { text: 'Sent the email I had been sitting on for a week.', shape: 'taped', kind: 'action' },
  { text: 'Nervous in the morning, fine by lunch. It passes faster than I expect.', shape: 'blob', kind: 'emotion' },
  { text: 'Rain all afternoon. Wrote with the window open.', shape: 'wave', kind: 'day' },
  { text: 'Cut the third project. Two is enough.', shape: 'torn', kind: 'action' },
  { text: 'Proud, quietly.', shape: 'circle', kind: 'emotion' },
  { text: 'Long day but a good one', shape: 'burst', kind: 'day' },
  { text: 'Ran 3k without stopping to check the time.', shape: 'ticket', kind: 'action' },
  { text: 'Mei said the type looked confident. I believed her.', shape: 'bubble', kind: 'emotion' },
]

const memos = MEMO_SEED.map((m, i) => {
  const date = addDays(todayStr(), -(i % 6))
  return {
    ...m,
    id: `m${i}`,
    date,
    createdAt: new Date(`${date}T${String(9 + (i % 8)).padStart(2, '0')}:${i % 2 ? '41' : '12'}:00`).toISOString(),
  }
})

const value = {
  user: { displayName: 'Zoey Zhu', email: 'zzhu@ideo.com', photoURL: null },
  authReady: true,
  loading: false,
  syncing: false,
  error: null,
  toast: null,
  showToast: (m) => console.log('toast:', m),
  signIn: () => {},
  signOut: () => {},
  meta: {
    startDate: START,
    checkins,
    questions: DEFAULT_QUESTIONS,
    weeklyQuestions: DEFAULT_WEEKLY_QUESTIONS,
    habits: DEFAULT_HABITS,
  },
  entries,
  weeklyEntries,
  goals,
  days,
  inspo,
  stories: {},
  memos,
  entryFor: (d) => entries.find((e) => e.date === d) || null,
  weeklyFor: (k) => weeklyEntries.find((w) => w.weekKey === k) || null,
  prioritiesFor: (d) => days[d]?.priorities || [],
  memosFor: (d) => memos.filter((m) => m.date === d),
  goalFor: (id) => goals.find((g) => g.id === id) || null,
  patchMeta: async () => true,
  saveEntry: async () => true,
  moveEntry: async () => true,
  saveWeekly: async () => true,
  setPriorities: async () => true,
  saveGoal: async () => true,
  deleteGoal: async () => true,
  saveInspo: async (d) => ({ ...d, id: 'new' }),
  deleteInspo: async () => true,
  saveStoryNote: async () => true,
  saveMemo: async (m) => ({ ...m, id: 'new', createdAt: new Date().toISOString() }),
  deleteMemo: async () => true,
  exportAll: () => {},
  newId: () => `id-${Math.random().toString(36).slice(2)}`,
}

const VIEWS = ['zos', 'today', 'goals', 'weekly', 'journal', 'insights', 'settings', 'story']

function Harness() {
  const initial = new URLSearchParams(location.search).get('view') || 'today'
  const [view, setView] = useState(VIEWS.includes(initial) ? initial : 'today')
  const [theme, setTheme] = useState(
    new URLSearchParams(location.search).get('theme') || 'jour'
  )
  document.documentElement.dataset.theme = theme === 'nuit' ? 'nuit' : 'jour'

  return (
    <>
      <div className="paper-wash" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="shell">
        <header className="masthead">
          <p className="eyebrow">Zoey's Diary</p>
          <div className="row" style={{ gap: '0.55rem', flexWrap: 'nowrap' }}>
            <span className="dot" />
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === 'jour' ? 'nuit' : 'jour')}
            >
              ☾
            </button>
          </div>
        </header>
        <main>
          {view === 'story' && (
            <WeekStory weekNum={weekNumber(START, todayStr())} onClose={() => setView('today')} />
          )}
          {view === 'zos' && <ZOS go={setView} />}
          {view === 'today' && <Today go={setView} />}
          {view === 'goals' && <Goals />}
          {view === 'weekly' && <Weekly />}
          {view === 'journal' && <Journal />}
          {view === 'insights' && <Insights />}
          {view === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
        </main>
      </div>
      <nav className="nav">
        {VIEWS.map((v) => (
          <button
            key={v}
            className={`nav-item${view === v ? ' on' : ''}`}
            onClick={() => setView(v)}
          >
            <span>✦</span>
            <span>{v}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StoreContext.Provider value={value}>
    <Harness />
  </StoreContext.Provider>
)
