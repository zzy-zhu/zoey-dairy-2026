import { useEffect, useRef } from 'react'

/**
 * A bottom sheet on phones, a centred dialog on wider screens. Closes on
 * Escape and on a backdrop tap, and locks the page behind it.
 */
export default function Sheet({ title, subtitle, onClose, actions, aside, children }) {
  const backdrop = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="overlay"
      ref={backdrop}
      onMouseDown={(e) => {
        if (e.target === backdrop.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="sheet">
        <div className="sheet-top">
          <div>
            <h2 className="display">{title}</h2>
            {subtitle && (
              <p className="tiny" style={{ marginTop: 3 }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
            {aside}
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        {children}
        {actions && <div className="sheet-actions">{actions}</div>}
      </div>
    </div>
  )
}
