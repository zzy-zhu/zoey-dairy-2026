import { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import InspoSheet from '../components/InspoSheet.jsx'
import { SparkCapture, SparkRow } from '../components/Sparks.jsx'
import { generateInsights, getApiKey, insightsToText, setApiKey } from '../lib/insights.js'
import { dayToDate, fmtShort, todayStr, weekLabel, weekNumber } from '../lib/dates.js'

export default function Insights() {
  const { meta, entries, goals, inspo, deleteInspo, showToast } = useStore()
  const [openInspo, setOpenInspo] = useState(null)
  const [filter, setFilter] = useState('')

  const activeGoals = goals.filter((g) => !g.archived && !g.doneAt)

  const filtered = useMemo(
    () => (filter ? inspo.filter((d) => d.goalId === filter) : inspo),
    [inspo, filter]
  )

  // Newest first, grouped by the day they were written.
  const grouped = useMemo(() => {
    const out = {}
    filtered.forEach((s) => {
      ;(out[s.date] ||= []).push(s)
    })
    return out
  }, [filtered])
  const currentWeek = weekNumber(meta.startDate, todayStr())

  const [key, setKey] = useState(getApiKey())
  const [keySaved, setKeySaved] = useState(false)
  const [week, setWeek] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Only weeks that actually have something to read.
  const options = useMemo(() => {
    const list = []
    for (let n = 1; n <= currentWeek; n++) {
      const dates = []
      for (let i = (n - 1) * 7 + 1; i <= n * 7; i++) dates.push(dayToDate(meta.startDate, i))
      const found = entries.filter((e) => dates.includes(e.date) && e.article)
      if (found.length) list.push({ n, count: found.length, entries: found })
    }
    return list.reverse()
  }, [entries, meta.startDate, currentWeek])

  async function run() {
    const chosen = options.find((o) => String(o.n) === week)
    if (!chosen) {
      showToast('Pick a week first')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const label = weekLabel(meta.startDate, chosen.n)
      const out = await generateInsights({ label, entries: chosen.entries, apiKey: key })
      setResult({ ...out, label })
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    const text = insightsToText(result)
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `reflections-week-${week}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="stack">
      <section className="card card-lift card-tint-gold">
        <p className="eyebrow" style={{ color: 'var(--gold)' }}>
          Inspiration + reflections
        </p>
        <h1 className="display" style={{ margin: '0.3rem 0 0.35rem' }}>
          Everything you kept
        </h1>
        <p className="muted">
          Sparks you wrote down, and what Claude noticed in a week of entries.
        </p>
      </section>

      <div className="section-head">
        <h2 className="display">Inspiration</h2>
        <span className="tiny">{inspo.length} written down</span>
      </div>

      <section className="card">
        <SparkCapture goals={activeGoals} />
      </section>

      {goals.length > 0 && inspo.length > 0 && (
        <div className="row">
          <button className={`chip${filter === '' ? ' on' : ''}`} onClick={() => setFilter('')}>
            everything
          </button>
          {goals.map((g) => (
            <button
              key={g.id}
              className={`chip${filter === g.id ? ' on' : ''}`}
              onClick={() => setFilter(g.id)}
            >
              {g.title.length > 22 ? g.title.slice(0, 22) + '…' : g.title}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="empty">
          {inspo.length === 0 ? 'nothing written down yet' : 'nothing tied to that goal yet'}
        </p>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <section className="card" key={date}>
            <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
              {fmtShort(date)}
            </p>
            {items.map((s) => (
              <SparkRow
                key={s.id}
                spark={s}
                goals={goals}
                onOpen={setOpenInspo}
                onDelete={deleteInspo}
              />
            ))}
          </section>
        ))
      )}

      <div className="section-head">
        <h2 className="display">Week reflections</h2>
      </div>

      <section className="card">
        <div className="field">
          <label className="field-label" htmlFor="api-key">
            Anthropic API key
          </label>
          <div className="row" style={{ gap: '0.5rem' }}>
            <input
              id="api-key"
              type="password"
              value={key}
              placeholder="sk-ant-…"
              onChange={(e) => {
                setKey(e.target.value)
                setKeySaved(false)
              }}
              style={{ maxWidth: 280 }}
            />
            <button
              className="btn btn-sm"
              onClick={() => {
                setApiKey(key)
                setKeySaved(true)
                showToast(key.trim() ? 'Key saved on this device' : 'Key cleared')
              }}
            >
              Save
            </button>
            {keySaved && <span className="tiny" style={{ color: 'var(--jade)' }}>Saved ✓</span>}
          </div>
          <p className="tiny">
            Stored only in this browser and sent straight to Anthropic. Get one at
            console.anthropic.com.
          </p>
        </div>

        <div className="divider" />

        <div className="row">
          <select value={week} onChange={(e) => setWeek(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="">Choose a week…</option>
            {options.map((o) => (
              <option key={o.n} value={o.n}>
                {weekLabel(meta.startDate, o.n)} ({o.count}{' '}
                {o.count === 1 ? 'entry' : 'entries'})
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={run} disabled={loading || !week}>
            {loading ? 'Reading…' : 'Reflect →'}
          </button>
        </div>
        {options.length === 0 && (
          <p className="tiny" style={{ marginTop: '0.6rem' }}>
            Write a few days first and there'll be something to reflect on.
          </p>
        )}
      </section>

      {loading && (
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="muted" style={{ marginBottom: '0.6rem' }}>
            ✦ Claude is reading your week…
          </p>
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
        </section>
      )}

      {error && (
        <section className="card">
          <p className="muted" style={{ color: 'var(--coral)' }}>
            {error}
          </p>
        </section>
      )}

      {result && (
        <>
          <div className="section-head">
            <h2 className="display">{result.label}</h2>
          </div>
          {result.insights.map((ins, i) => (
            <section className="card insight" key={i}>
              <div className="insight-n">{i + 1}</div>
              <h3 className="display" style={{ marginBottom: '0.4rem' }}>
                {ins.title}
              </h3>
              <p className="insight-body">{ins.body}</p>
            </section>
          ))}
          {result.carryForward && (
            <section className="card card-tint-jade">
              <p className="eyebrow" style={{ color: 'var(--jade)' }}>
                Carry forward
              </p>
              <p className="serif-quote" style={{ marginTop: '0.5rem', color: 'var(--ink)' }}>
                {result.carryForward}
              </p>
            </section>
          )}
          <div className="row">
            <button className="btn" onClick={download}>
              ↓ Save as text
            </button>
          </div>
        </>
      )}

      {openInspo && (
        <InspoSheet
          doc={openInspo}
          onClose={() => setOpenInspo(null)}
          onDelete={deleteInspo}
        />
      )}
    </div>
  )
}
