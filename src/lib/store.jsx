import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase.js'
import { todayStr } from './dates.js'

export const DEFAULT_QUESTIONS = [
  "What's one thing you're genuinely looking forward to today?",
  'What did you learn yesterday — about yourself, your work, or the world?',
  'What is one specific thing you want to move forward on in your learning today?',
  "What's the smallest step you can take today toward your career goal?",
  'How are you feeling right now? Any emotion worth noticing?',
  "What's one thing you're grateful for, however small?",
  'In 90 days, who do you want to have become?',
]

export const DEFAULT_WEEKLY_QUESTIONS = [
  'What were your 3 biggest wins this week?',
  "What drained you or didn't go as planned? What would you do differently?",
  'What did you learn about yourself this week?',
  'How did you make progress toward your goals?',
  "What's the one thing you want to focus on next week?",
  'How are you feeling about your direction right now — creatively, professionally, personally?',
]

// The original app hardcoded these two habits and stored them as
// `habits: {exercise: bool, reading: bool}`. Keeping the same ids means old
// entries keep their ticks; new habits can be added in Settings.
export const DEFAULT_HABITS = [
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
  { id: 'reading', label: 'Reading', icon: '📖' },
]

const EMPTY_META = {
  startDate: null,
  checkins: {},
  questions: DEFAULT_QUESTIONS,
  weeklyQuestions: DEFAULT_WEEKLY_QUESTIONS,
  habits: DEFAULT_HABITS,
}

export const StoreContext = createContext(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [meta, setMeta] = useState(EMPTY_META)
  const [entries, setEntries] = useState([])
  const [weeklyEntries, setWeeklyEntries] = useState([])
  const [goals, setGoals] = useState([])
  const [days, setDays] = useState({}) // date -> { priorities: [...] }
  const [inspo, setInspo] = useState([])
  const [stories, setStories] = useState({}) // weekKey -> saved story note

  const showToast = useCallback((message) => {
    setToast({ message, id: newId() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // ─── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Some mobile browsers block popups; those sign-ins come back as redirects.
    getRedirectResult(auth).catch((e) => setError(e.message))
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (
        e.code === 'auth/popup-blocked' ||
        e.code === 'auth/popup-closed-by-user' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (e2) {
          setError(e2.message)
          return
        }
      }
      setError(e.message)
    }
  }, [])

  const signOut = useCallback(() => fbSignOut(auth), [])

  // ─── Load ─────────────────────────────────────────────────────────────────
  const uid = user?.uid ?? null

  useEffect(() => {
    if (!uid) {
      setMeta(EMPTY_META)
      setEntries([])
      setWeeklyEntries([])
      setGoals([])
      setDays({})
      setInspo([])
      setStories({})
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const metaSnap = await getDoc(doc(db, 'users', uid, 'data', 'meta'))
        let nextMeta
        if (metaSnap.exists()) {
          const m = metaSnap.data()
          nextMeta = {
            startDate: m.startDate || todayStr(),
            checkins: m.checkins || {},
            questions: m.questions?.length ? m.questions : DEFAULT_QUESTIONS,
            weeklyQuestions: m.weeklyQuestions?.length
              ? m.weeklyQuestions
              : DEFAULT_WEEKLY_QUESTIONS,
            habits: m.habits?.length ? m.habits : DEFAULT_HABITS,
          }
        } else {
          nextMeta = { ...EMPTY_META, startDate: todayStr() }
          await setDoc(doc(db, 'users', uid, 'data', 'meta'), nextMeta)
        }

        const [entrySnap, weeklySnap, goalSnap, daySnap, inspoSnap, storySnap] =
          await Promise.all([
            getDocs(query(collection(db, 'users', uid, 'entries'), orderBy('date', 'desc'))),
            getDocs(
              query(collection(db, 'users', uid, 'weeklyEntries'), orderBy('weekKey', 'desc'))
            ),
            getDocs(collection(db, 'users', uid, 'goals')),
            getDocs(
              query(collection(db, 'users', uid, 'days'), orderBy('date', 'desc'), limit(180))
            ),
            getDocs(
              query(collection(db, 'users', uid, 'inspo'), orderBy('createdAt', 'desc'), limit(60))
            ),
            getDocs(collection(db, 'users', uid, 'stories')),
          ])

        if (cancelled) return
        setMeta(nextMeta)
        setEntries(entrySnap.docs.map((d) => ({ ...d.data(), date: d.data().date || d.id })))
        setWeeklyEntries(weeklySnap.docs.map((d) => d.data()))
        setGoals(
          goalSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        )
        const dayMap = {}
        daySnap.docs.forEach((d) => {
          dayMap[d.id] = { priorities: d.data().priorities || [] }
        })
        setDays(dayMap)
        setInspo(inspoSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
        const storyMap = {}
        storySnap.docs.forEach((d) => {
          storyMap[d.id] = d.data()
        })
        setStories(storyMap)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [uid])

  // ─── Writes ───────────────────────────────────────────────────────────────
  const write = useCallback(
    async (fn, failureMessage) => {
      setSyncing(true)
      try {
        await fn()
        return true
      } catch (e) {
        console.error(e)
        showToast(failureMessage || "Couldn't save — check your connection")
        return false
      } finally {
        setSyncing(false)
      }
    },
    [showToast]
  )

  const patchMeta = useCallback(
    async (patch) => {
      if (!uid) return false
      const next = { ...meta, ...patch }
      setMeta(next)
      return write(
        () => setDoc(doc(db, 'users', uid, 'data', 'meta'), next),
        "Couldn't save your settings"
      )
    },
    [uid, meta, write]
  )

  /**
   * Saves a daily entry. `checkIn` marks the day as written — habit-only or
   * mood-only saves pass false so a day you didn't actually write about
   * doesn't light up the calendar.
   */
  const saveEntry = useCallback(
    async (entry, { checkIn = true } = {}) => {
      if (!uid) return false
      const record = { ...entry, updatedAt: new Date().toISOString() }
      setEntries((prev) => {
        const rest = prev.filter((e) => e.date !== record.date)
        return [record, ...rest].sort((a, b) => b.date.localeCompare(a.date))
      })
      const nextCheckins = checkIn
        ? { ...meta.checkins, [record.date]: true }
        : meta.checkins
      if (checkIn) setMeta((m) => ({ ...m, checkins: nextCheckins }))
      return write(async () => {
        await setDoc(doc(db, 'users', uid, 'entries', record.date), record)
        if (checkIn) {
          await setDoc(
            doc(db, 'users', uid, 'data', 'meta'),
            { ...meta, checkins: nextCheckins },
            { merge: true }
          )
        }
      }, "Couldn't save your entry")
    },
    [uid, meta, write]
  )

  /** Moves an entry to a different date (used when fixing a mis-dated entry). */
  const moveEntry = useCallback(
    async (oldDate, entry) => {
      if (!uid) return false
      const record = { ...entry, updatedAt: new Date().toISOString() }
      const nextCheckins = { ...meta.checkins }
      delete nextCheckins[oldDate]
      nextCheckins[record.date] = true
      setEntries((prev) =>
        [record, ...prev.filter((e) => e.date !== oldDate && e.date !== record.date)].sort(
          (a, b) => b.date.localeCompare(a.date)
        )
      )
      setMeta((m) => ({ ...m, checkins: nextCheckins }))
      return write(async () => {
        await setDoc(doc(db, 'users', uid, 'entries', record.date), record)
        await deleteDoc(doc(db, 'users', uid, 'entries', oldDate))
        await setDoc(
          doc(db, 'users', uid, 'data', 'meta'),
          { ...meta, checkins: nextCheckins },
          { merge: true }
        )
      }, "Couldn't move that entry")
    },
    [uid, meta, write]
  )

  const saveWeekly = useCallback(
    async (entry) => {
      if (!uid) return false
      const record = { ...entry, updatedAt: new Date().toISOString() }
      setWeeklyEntries((prev) =>
        [record, ...prev.filter((w) => w.weekKey !== record.weekKey)].sort(
          (a, b) => b.weekNum - a.weekNum
        )
      )
      return write(
        () => setDoc(doc(db, 'users', uid, 'weeklyEntries', record.weekKey), record),
        "Couldn't save your weekly reflection"
      )
    },
    [uid, write]
  )

  const setPriorities = useCallback(
    async (date, priorities) => {
      if (!uid) return false
      setDays((prev) => ({ ...prev, [date]: { priorities } }))
      return write(
        () => setDoc(doc(db, 'users', uid, 'days', date), { date, priorities }),
        "Couldn't save your priorities"
      )
    },
    [uid, write]
  )

  const saveGoal = useCallback(
    async (goal) => {
      if (!uid) return false
      const record = {
        ...goal,
        id: goal.id || newId(),
        createdAt: goal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setGoals((prev) => {
        const rest = prev.filter((g) => g.id !== record.id)
        return [record, ...rest].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      })
      const ok = await write(
        () => setDoc(doc(db, 'users', uid, 'goals', record.id), record),
        "Couldn't save that goal"
      )
      return ok && record
    },
    [uid, write]
  )

  const deleteGoal = useCallback(
    async (id) => {
      if (!uid) return false
      setGoals((prev) => prev.filter((g) => g.id !== id))
      return write(() => deleteDoc(doc(db, 'users', uid, 'goals', id)), "Couldn't delete that goal")
    },
    [uid, write]
  )

  /** Saves a generated inspiration document so you can come back to it. */
  const saveInspo = useCallback(
    async (docData) => {
      if (!uid) return false
      const record = {
        ...docData,
        id: docData.id || newId(),
        createdAt: docData.createdAt || new Date().toISOString(),
      }
      setInspo((prev) => [record, ...prev.filter((x) => x.id !== record.id)])
      const ok = await write(
        () => setDoc(doc(db, 'users', uid, 'inspo', record.id), record),
        "Couldn't save that"
      )
      return ok && record
    },
    [uid, write]
  )

  const deleteInspo = useCallback(
    async (id) => {
      if (!uid) return false
      setInspo((prev) => prev.filter((x) => x.id !== id))
      return write(() => deleteDoc(doc(db, 'users', uid, 'inspo', id)), "Couldn't delete that")
    },
    [uid, write]
  )

  /**
   * The closing note on a week's story. Cached per week so replaying a story
   * doesn't spend another API call.
   */
  const saveStoryNote = useCallback(
    async (weekKey, data) => {
      if (!uid) return false
      const record = { weekKey, ...data, createdAt: new Date().toISOString() }
      setStories((prev) => ({ ...prev, [weekKey]: record }))
      return write(
        () => setDoc(doc(db, 'users', uid, 'stories', weekKey), record),
        "Couldn't save the story note"
      )
    },
    [uid, write]
  )

  /** Everything in one JSON blob — the download-your-archive button. */
  const exportAll = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: user?.email || null,
      meta,
      entries,
      weeklyEntries,
      goals,
      days,
      inspo,
      stories,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `diary-archive-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    showToast('Archive downloaded')
  }, [user, meta, entries, weeklyEntries, goals, days, inspo, stories, showToast])

  const value = useMemo(
    () => ({
      user,
      authReady,
      loading,
      syncing,
      error,
      toast,
      showToast,
      signIn,
      signOut,
      meta,
      entries,
      weeklyEntries,
      goals,
      days,
      inspo,
      stories,
      entryFor: (date) => entries.find((e) => e.date === date) || null,
      weeklyFor: (weekKey) => weeklyEntries.find((w) => w.weekKey === weekKey) || null,
      prioritiesFor: (date) => days[date]?.priorities || [],
      goalFor: (id) => goals.find((g) => g.id === id) || null,
      patchMeta,
      saveEntry,
      moveEntry,
      saveWeekly,
      setPriorities,
      saveGoal,
      deleteGoal,
      saveInspo,
      deleteInspo,
      saveStoryNote,
      exportAll,
      newId,
    }),
    [
      user,
      authReady,
      loading,
      syncing,
      error,
      toast,
      showToast,
      signIn,
      signOut,
      meta,
      entries,
      weeklyEntries,
      goals,
      days,
      inspo,
      stories,
      patchMeta,
      saveEntry,
      moveEntry,
      saveWeekly,
      setPriorities,
      saveGoal,
      deleteGoal,
      saveInspo,
      deleteInspo,
      saveStoryNote,
      exportAll,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
