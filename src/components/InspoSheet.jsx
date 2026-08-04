import Sheet from './Sheet.jsx'
import { useStore } from '../lib/store.jsx'
import { inspoToText } from '../lib/insights.js'
import { fmtLong } from '../lib/dates.js'

/** The generated one-pager, rendered as a document you can keep or copy. */
export default function InspoSheet({ doc, onClose, onDelete }) {
  const { showToast } = useStore()
  const text = inspoToText(doc)

  return (
    <Sheet
      title={doc.title}
      subtitle={fmtLong(doc.date)}
      onClose={onClose}
      actions={
        <>
          <button
            className="btn"
            onClick={() =>
              navigator.clipboard
                .writeText(text)
                .then(() => showToast('Copied'))
                .catch(() => showToast('Select and copy manually'))
            }
          >
            Copy
          </button>
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([text], { type: 'text/plain' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `inspo-${doc.date}.txt`
              a.click()
              URL.revokeObjectURL(a.href)
            }}
          >
            ↓ Save
          </button>
          {onDelete && (
            <button
              className="btn btn-danger"
              onClick={() => {
                onDelete(doc.id)
                onClose()
              }}
            >
              Delete
            </button>
          )}
        </>
      }
    >
      <article className="doc">
        <p className="doc-lede">{doc.opening}</p>

        {doc.ideas?.map((idea, i) => (
          <section key={i}>
            <h3 className="display">{idea.title}</h3>
            <p>{idea.body}</p>
          </section>
        ))}

        <section className="doc-step">
          <p className="eyebrow" style={{ color: 'var(--jade)' }}>
            One small step
          </p>
          <p style={{ marginTop: '0.4rem' }}>{doc.smallStep}</p>
        </section>

        <p className="serif-quote">{doc.closing}</p>
      </article>
    </Sheet>
  )
}
