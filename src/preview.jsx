// Local-only harness: renders the views against fixture data so the layout can
// be inspected without signing in. Not part of the production build.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreContext, DEFAULT_QUESTIONS, DEFAULT_WEEKLY_QUESTIONS, DEFAULT_HABITS } from './lib/store.jsx'
import { buildArticle, buildWeeklyArticle } from './lib/format.js'
import { addDays, todayStr, weekKey, weekLabel } from './lib/dates.js'
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
      { id: 'p1', text: 'Typography pass on the case study', done: true },
      { id: 'p2', text: 'Reply to Mei about the workshop', done: false },
      { id: 'p3', text: 'Walk before the light goes', done: false },
    ],
  },
}

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
  entryFor: (d) => entries.find((e) => e.date === d) || null,
  weeklyFor: (k) => weeklyEntries.find((w) => w.weekKey === k) || null,
  prioritiesFor: (d) => days[d]?.priorities || [],
  patchMeta: async () => true,
  saveEntry: async () => true,
  moveEntry: async () => true,
  saveWeekly: async () => true,
  setPriorities: async () => true,
  saveGoal: async () => true,
  deleteGoal: async () => true,
  exportAll: () => {},
  newId: () => `id-${Math.random().toString(36).slice(2)}`,
}

const VIEWS = ['today', 'goals', 'weekly', 'journal', 'insights', 'settings']

function Harness() {
  const initial = new URLSearchParams(location.search).get('view') || 'today'
  const [view, setView] = useState(VIEWS.includes(initial) ? initial : 'today')
  const [theme, setTheme] = useState(
    new URLSearchParams(location.search).get('theme') || 'day'
  )
  document.documentElement.dataset.theme = theme === 'night' ? 'night' : 'day'

  return (
    <>
      <div className="sky" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="grain" aria-hidden="true" />
      <div className="shell">
        <header className="masthead">
          <p className="eyebrow">Zoey's Diary</p>
          <div className="row" style={{ gap: '0.55rem', flexWrap: 'nowrap' }}>
            <span className="dot" />
            <button className="icon-btn" onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}>
              ☾
            </button>
          </div>
        </header>
        <main>
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
