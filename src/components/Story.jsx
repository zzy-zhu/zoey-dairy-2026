import { useEffect, useRef, useState } from 'react'
import Memo from './Memo.jsx'

const SLIDE_MS = 6500

/**
 * Tap-through weekly recap, built like a phone story: progress pips along the
 * top, tap the right half to go on, the left half to go back, press and hold
 * to pause. Arrow keys and Escape work on a desktop too.
 */
export default function Story({ slides, title, onClose, onGenerateNote, generating }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const holdTimer = useRef(null)
  const startY = useRef(null)

  const slide = slides[i]
  const last = i === slides.length - 1

  const next = () => setI((n) => (n < slides.length - 1 ? n + 1 : n))
  const prev = () => setI((n) => Math.max(0, n - 1))

  // Auto-advance, except on the closing card — that one waits for you.
  useEffect(() => {
    if (paused || last) return
    const t = setTimeout(next, SLIDE_MS)
    return () => clearTimeout(t)
  }, [i, paused, last])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  function pressStart(e) {
    startY.current = e.touches?.[0]?.clientY ?? null
    holdTimer.current = setTimeout(() => setPaused(true), 220)
  }

  function pressEnd(e, dir) {
    clearTimeout(holdTimer.current)
    // Swipe down closes, the way a story does.
    const endY = e.changedTouches?.[0]?.clientY
    if (startY.current != null && endY != null && endY - startY.current > 90) {
      onClose()
      return
    }
    if (paused) {
      setPaused(false)
      return
    }
    if (dir === 'next') next()
    else prev()
  }

  return (
    <div className="story" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`story-card tint-${slide.tint}`}>
        <div className="story-pips">
          {slides.map((_, n) => (
            <span key={n} className={n < i ? 'done' : ''}>
              {n === i && (
                <i
                  key={`${i}-${paused}`}
                  style={{
                    animationDuration: `${SLIDE_MS}ms`,
                    animationPlayState: paused ? 'paused' : 'running',
                    ...(last ? { width: '100%', animation: 'none' } : null),
                  }}
                />
              )}
            </span>
          ))}
        </div>

        <div className="story-bar">
          <span className="story-title">{title}</span>
          <button className="story-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tap zones sit under the content so buttons stay clickable. */}
        <button
          className="story-zone left"
          aria-label="Previous"
          onTouchStart={pressStart}
          onTouchEnd={(e) => pressEnd(e, 'prev')}
          onMouseDown={pressStart}
          onMouseUp={(e) => pressEnd(e, 'prev')}
        />
        <button
          className="story-zone right"
          aria-label="Next"
          onTouchStart={pressStart}
          onTouchEnd={(e) => pressEnd(e, 'next')}
          onMouseDown={pressStart}
          onMouseUp={(e) => pressEnd(e, 'next')}
        />

        <div className="story-body" key={i}>
          <Slide
            slide={slide}
            onGenerateNote={onGenerateNote}
            generating={generating}
            onClose={onClose}
          />
        </div>

        {paused && <div className="story-paused">paused</div>}
      </div>
    </div>
  )
}

function Slide({ slide, onGenerateNote, generating, onClose }) {
  const eyebrow = slide.eyebrow && <p className="story-eyebrow">{slide.eyebrow}</p>

  if (slide.kind === 'cover') {
    return (
      <>
        {eyebrow}
        <h2 className="story-headline xl">{slide.headline}</h2>
        <p className="story-sub">{slide.sub}</p>
        <p className="story-hint">tap to begin →</p>
      </>
    )
  }

  if (slide.kind === 'big') {
    return (
      <>
        {eyebrow}
        <div className="story-number">{slide.big}</div>
        {slide.unit && <p className="story-unit">{slide.unit}</p>}
        {slide.sub && <p className="story-sub">{slide.sub}</p>}
      </>
    )
  }

  if (slide.kind === 'list') {
    return (
      <>
        {eyebrow}
        <h2 className="story-headline">{slide.headline}</h2>
        <div className="story-list">
          {slide.items.map((it, n) => (
            <div className="story-item" key={n}>
              <span className="story-item-top">
                <span>
                  {it.icon} {it.label}
                </span>
                <strong>{it.value}</strong>
              </span>
              {it.bar != null && (
                <span className="story-bar-track">
                  <i style={{ width: `${Math.min(100, it.bar * 100)}%` }} />
                </span>
              )}
            </div>
          ))}
        </div>
      </>
    )
  }

  if (slide.kind === 'memos') {
    return (
      <>
        {eyebrow}
        <h2 className="story-headline">{slide.headline}</h2>
        <div className="story-memos">
          {slide.memos.map((m) => (
            <Memo key={m.id} memo={m} small />
          ))}
        </div>
      </>
    )
  }

  if (slide.kind === 'pattern') {
    return (
      <>
        {eyebrow}
        <h2 className="story-headline">{slide.headline}</h2>
        {slide.sub && <p className="story-sub big">{slide.sub}</p>}
        <div className="story-list">
          {slide.items.map((it, n) => (
            <div className="story-item" key={n}>
              <span className="story-item-top">
                <span>{it.label}</span>
                <strong>{it.value}</strong>
              </span>
              <span className="story-bar-track">
                <i style={{ width: `${Math.min(100, it.bar * 100)}%` }} />
              </span>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (slide.kind === 'mood') {
    return (
      <>
        {eyebrow}
        <div className="story-word">{slide.big}</div>
        {slide.sub && <p className="story-sub">{slide.sub}</p>}
        <div className="story-cloud">
          {slide.items.map((m, n) => (
            <span key={n}>{m}</span>
          ))}
        </div>
      </>
    )
  }

  if (slide.kind === 'quote') {
    return (
      <>
        {eyebrow}
        <blockquote className="story-quote">{slide.headline}</blockquote>
        <p className="story-sub">{slide.sub}</p>
      </>
    )
  }

  if (slide.kind === 'goal') {
    return (
      <>
        {eyebrow}
        <div className="story-goal-dot" style={{ background: slide.accent }} />
        <h2 className="story-headline">{slide.headline}</h2>
        <p className="story-sub">{slide.sub}</p>
        {slide.items?.length > 0 && (
          <div className="story-list" style={{ marginTop: '1.25rem' }}>
            {slide.items.map((it, n) => (
              <div className="story-item" key={n}>
                <span className="story-item-top">
                  <span>
                    <i className="story-tick" style={{ background: it.accent }} /> {it.label}
                  </span>
                  <strong>{it.value}</strong>
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  // closing
  return (
    <>
      {eyebrow}
      <h2 className="story-headline">{slide.headline}</h2>
      {slide.sub && <p className="story-sub big">{slide.sub}</p>}
      <div className="story-actions">
        {slide.canGenerate && onGenerateNote && (
          <button className="btn btn-sm" onClick={onGenerateNote} disabled={generating}>
            {generating ? 'Reading your week…' : '✦ Have Claude close it out'}
          </button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </>
  )
}
