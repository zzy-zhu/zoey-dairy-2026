import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './lib/store.jsx'
import SignIn from './components/SignIn.jsx'
import ZOS from './views/ZOS.jsx'
import Today from './views/Today.jsx'
import Goals from './views/Goals.jsx'
import Weekly from './views/Weekly.jsx'
import Journal from './views/Journal.jsx'
import Insights from './views/Insights.jsx'
import Settings from './views/Settings.jsx'

const TABS = [
  { id: 'zos', label: 'zOS', icon: '◧' },
  { id: 'today', label: 'Today', icon: '☀' },
  { id: 'goals', label: 'Goals', icon: '◎' },
  { id: 'weekly', label: 'Week', icon: '❧' },
  { id: 'journal', label: 'Logs', icon: '❏' },
  { id: 'insights', label: 'Notes', icon: '✦' },
]

const ALL_TABS = [...TABS.map((t) => t.id), 'settings']

export default function App() {
  return (
    <StoreProvider>
      <Backdrop />
      <Chrome />
    </StoreProvider>
  )
}

function Backdrop() {
  return (
    <>
      <div className="paper-wash" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  )
}

function Chrome() {
  const { user, authReady, loading, syncing, error, toast, signOut, meta } = useStore()
  const [theme, setTheme] = useTheme()
  const [tab, setTab] = useTab()

  if (!authReady) {
    return (
      <div className="gate">
        <p className="muted">Opening your diary…</p>
      </div>
    )
  }

  if (!user) return <SignIn />

  return (
    <>
      <div className="shell">
        <header className="masthead">
          <div>
            <p className="eyebrow">Zoey's Diary</p>
          </div>
          <div className="row" style={{ gap: '0.55rem', flexWrap: 'nowrap' }}>
            <span
              className={`dot${syncing || loading ? ' busy' : ''}`}
              title={syncing || loading ? 'Syncing…' : 'Everything saved'}
            />
            <button
              className="icon-btn"
              onClick={() => setTab('settings')}
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>
            {user.photoURL ? (
              <img
                className="avatar"
                src={user.photoURL}
                alt="You"
                title="Sign out"
                onClick={() => {
                  if (confirm('Sign out?')) signOut()
                }}
              />
            ) : null}
          </div>
        </header>

        {/* Fixed to the bottom on phones; sits under the masthead on desktop. */}
        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item${tab === t.id ? ' on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {error && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p className="muted" style={{ color: 'var(--coral)' }}>
              {error}
            </p>
          </div>
        )}

        {loading || !meta.startDate ? (
          <p className="empty">Loading everything you've written…</p>
        ) : (
          <main>
            {tab === 'zos' && <ZOS go={setTab} />}
            {tab === 'today' && <Today go={setTab} />}
            {tab === 'goals' && <Goals />}
            {tab === 'weekly' && <Weekly />}
            {tab === 'journal' && <Journal />}
            {tab === 'insights' && <Insights />}
            {tab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
          </main>
        )}
      </div>

      {toast && <div className="toast">{toast.message}</div>}
    </>
  )
}

/** 'auto' follows the system; 'jour' / 'nuit' pin the palette. */
function useTheme() {
  const [pref, setPref] = useState(() => localStorage.getItem('diary_theme_pref') || 'auto')

  useEffect(() => {
    localStorage.setItem('diary_theme_pref', pref)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = pref === 'auto' ? (mq.matches ? 'nuit' : 'jour') : pref
      document.documentElement.dataset.theme = resolved
      localStorage.setItem('diary_theme', resolved)
    }
    apply()
    if (pref !== 'auto') return
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])

  return [pref, setPref]
}

/** Keeps the current view in the URL hash so back/refresh land where you were. */
function useTab() {
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.replace('#', '')
    return ALL_TABS.includes(fromHash) ? fromHash : 'zos'
  })

  useEffect(() => {
    if (window.location.hash.replace('#', '') !== tab) {
      window.history.replaceState(null, '', `#${tab}`)
    }
  }, [tab])

  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash.replace('#', '')
      if (ALL_TABS.includes(next)) setTab(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tab])

  return [tab, setTab]
}
